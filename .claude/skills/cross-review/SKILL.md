---
name: cross-review
description: "Bir dokümanı bağımsız ikinci bir AI'ya okutup bulguları yansıtır; audit ve deep review'dan sonra çalışır. Kullan: 'cross-review', 'ikinci görüş', /cross-review Docs/XX_....md."
user-invocable: true
---

# Cross Review — Bağımsız İkinci AI Review Döngüsü

> **Ne zaman:** Bir dokümanın audit'i ve deep review'ı tamamlandıktan sonra.
> **Tetikleme:** "cross-review", "ikinci görüş" veya `/cross-review Docs/XX_....md`.
>
> **Temel fark:** Audit ve deep review **aynı ajanın iç denetimi**dir. Cross review, dokümanı **farklı bir modele** okutarak birinci ajanın kaçırdığını yakalar. Farklı model hem avantajdır (taze göz) hem dezavantaj (proje bağlamını bilmez).

## Parametreler

| Parametre | Zorunlu | Açıklama |
|---|---|---|
| `hedef` | Evet | Review edilecek doküman yolu |
| `round` | Hayır | Kaçıncı tur (varsayılan 1) |

## Oturum düzeni

Her adım **taze bir oturumda** (ya da taze bağlamlı bir alt ajanda) yürür; adımlar arasındaki devir yalnız dosyadır (00 §C.5):

| Adım | Oturum | Girdi | Çıktı |
|---|---|---|---|
| Tur N — Faz 1–3 | Tur başına bir oturum | Hedef doküman · bağlam dokümanları · **o dokümanın önceki bütün tur raporları** | `XX_CROSS_REVIEW[_RN].md` — ham bulgular, karar tablosu, kullanıcı onayları |
| Faz 4.1 — Düzeltme uygulama | Ayrı oturum | Hedef doküman · bu turun rapor dosyası | Düzeltilmiş doküman + rapordaki "Uygulandı" işaretleri |
| Faz 5 — Etki yansıtma | Ayrı oturum | Hedef doküman · bütün tur raporları · downstream/upstream dokümanlar | Son tur raporundaki etki yansıtma sonucu |

Bir oturumun başka oturumdan bildiği her şey bu dosyalarda yazılı olandır. Rapora yazılmamış karar sonraki adıma geçmez.

Kullanıcı kararı gereken adımlar (Faz 3, Faz 4.1'in onay adımı) ana oturumda yürür; alt ajan kullanıcıyla konuşamaz.

---

## Faz 1 — İkinci modele gönder

1. Dokümanı ikinci modele gönder (SETUP'ta tanımlanan yöntemle: script, web arayüzü veya API).
2. **Yedi kriter** istenir: tutarlılık · eksiklik · belirsizlik · teknik doğruluk · edge case · güvenlik · kullanıcı deneyimi.
3. Çıktı yapılandırılmış olmalı: `BULGU-N: …` veya `SONUÇ: TEMİZ`.
4. Ham çıktı `Docs/CROSS_REVIEW_REPORTS/XX_CROSS_REVIEW[_RN].md` dosyasına yazılır.
5. **Çıktıyı tam oku** — her bulguyu not al.

---

## Faz 2 — Bağımsız değerlendirme

> **KRİTİK KURAL:** Her bulguya otomatik "katılıyorum" deme. **Rubber stamp yasaktır.**

**Önceki turlar girdidir.** Tur 2'den itibaren değerlendirici o dokümanın önceki bütün tur raporlarını okur. Amaç turlar arası gerekçe tutarlılığıdır: aynı soruya bir turda KABUL, sonrakinde gerekçesiz RET verilmez. Önceki karar yeni bulgunun yerine karar vermez — her bulgu yine aşağıdaki adımlarla bizzat kontrol edilir.

Her bulgu için:

1. **Dokümanı bizzat kontrol et** — işaret edilen bölümü oku.
2. **Proje bağlamını değerlendir** — ilgili diğer dokümanları kontrol et. İkinci modelin bunlara erişimi olmadığı için bağlam kaçırmış olabilir.
3. **Karar ver:**
   - ✅ **KABUL** — haklı, düzeltme gerekli; düzeltme önerisi sun
   - ❌ **RET** — yanlış veya bağlamı kaçırıyor; **somut gerekçe zorunlu** (doküman bölümü, proje kararı — "ben böyle düşünüyorum" yetersiz)
   - ⚠️ **KISMİ** — sorun gerçek ama önerilen çözüm uygun değil; alternatif sun
4. **Kararı anında rapora işle** — karar verildiği anda rapor dosyasının "Bağımsız Değerlendirme" tablosuna yazılır; bulgular bitince toplu yazılmaz (INSTRUCTIONS §2 "Kararları anında kayıt altına al"). KABUL ve KISMİ satırı Faz 4.1'in tek girdisidir ve şunları **tam metin** taşır:
   - **Hedef bölüm** — dokümandaki yer (§ numarası)
   - **İstenen değişiklik** — ne eklenecek, ne değişecek, ne silinecek. KISMİ'de kabul edilen **alternatifin tam metni**; "alternatifi uygula" gibi bir atıf yetmez.
   - **Gerekçe** — düzeltmeyi uygulayan oturum bu kararın düşünce akışını görmez, yalnız bu satırı görür.
5. **Kaçırdıklarını da raporla** — ikinci modelin listesiyle sınırlı kalma; okurken fark ettiklerini "Ek Bulgular" olarak ekle (aynı satır yapısıyla).

**Objektivite kuralları:**
- **%100 KABUL şüphelidir.** Her zaman kendi analizini yap.
- **%100 RET de şüphelidir.** Savunmacılık, rubber stamp'in aynadaki hâlidir.
- RET gerekçesi somut referans olmalıdır.

---

## Faz 3 — Sunum

1. Rapor dosyasındaki "Bağımsız Değerlendirme" tablosunun eksiksiz olduğunu doğrula — her bulgunun satırı Faz 2'de yazılmış olmalı.
2. Kullanıcıya özet sun: kaç bulgu geldi, kaçı kabul/ret/kısmi, her biri için kısa açıklama ve karar.
3. Ek bulguları da sun.
4. **Hangi düzeltmelerin uygulanacağına kullanıcı karar verir.**
5. **Onayı anında rapora işle** — kullanıcının her onayı, reddi veya değişiklik isteği verildiği anda rapordaki kullanıcı onay checklist'ine yazılır. Kullanıcı istenen değişikliği değiştirirse satırın metni de güncellenir; Faz 4.1 yalnız rapordaki metni uygular.

---

## Faz 4 — Düzeltme ve tekrar

### 4.1 Düzeltme uygulama (ayrı oturum)

1. **Girdi** — hedef doküman ve bu turun rapor dosyası. Uygulanan yalnız kullanıcının onayladığı satırlardır.
2. **Satır yeterli mi** — hedef bölüm, istenen değişiklik veya gerekçe eksikse, ya da KISMİ satırında alternatifin metni yoksa o satır **tahminle uygulanmaz**; eksik satır kullanıcıya sunulur, tamamlanınca uygulanır.
3. **Bölüm sırasıyla** — doküman baştan sona gezilir. Bir bölümün bütün düzeltmeleri **tek turda toplu** yapılır (aynı turda birden çok düzenleme); bölüm bölüm ilerlenir.
4. **Kayıt** — uygulanan her satır rapordaki tabloda "Uygulandı" diye anında işaretlenir.
5. **Tamamlama Protokolü** — bütün düzeltmeler bitince `00 §C.4`'ün üç kontrolü (çapraz referans · iç tutarlılık · bağımlılık taraması) aynı oturumda koşulur. Düzeltmenin doğurduğu tutarsızlık burada kapatılır.
6. Doküman versiyonunu yükselt.

Düzeltme uygulama yazım işidir ama normatif metin üretir; model ve effort düşürülmez (Opus high — [`AGENT_ROLES.md`](../../AGENT_ROLES.md)).

### 4.2 Tekrar

1. `--round N+1` ile, yeni bir tur oturumunda tekrar gönder.
2. Faz 1'den itibaren tekrarla.
3. **Çıkış koşulu:** İkinci model `SONUÇ: TEMİZ` döndüğünde döngü biter.

---

## Faz 5 — Etki yansıtma (ATLANAMAZ)

> İkinci model her dokümanı **izole** okur; cross-document uyumsuzlukları yakalamaz. Bu adım o boşluğu kapatır.

TEMİZ sonrası, ayrı oturumda (bkz. Oturum düzeni):

1. **Downstream tarama** — bu dokümanı bağımlılık olarak listeleyen dokümanlar: yapılan düzeltmeler oralarda karşılığını buldu mu?
2. **Upstream tarama** — bu dokümanın bağımlılıkları: cross-review sırasında alınan yeni kararlar kaynak dokümanları etkiliyor mu?
3. **Yeni alan/kural taraması** — cross-review sırasında eklenen her yeni alan, enum değeri, parametre, iş kuralı ilgili dokümanda tanımlı mı?
4. Uyumsuzlukları hedefli düzeltmelerle kapat; her düzeltme kaydedilir.

> **Vaka:** Bir kodlama kılavuzunun cross-review'ında eklenen üç yeni alan, veri modeli dokümanında tanımlı değildi. Ne audit ne cross-review yakaladı — **etki yansıtmanın ardından çalıştırılan checkpoint** yakaladı. Kalite döngüsünün tamamı gerekli.

---

## Rapor dosya yapısı

```
Docs/CROSS_REVIEW_REPORTS/
├── XX_CROSS_REVIEW.md      # Tur 1
├── XX_CROSS_REVIEW_R2.md   # Tur 2
└── …
```

Her rapor: ham bulgular · bağımsız değerlendirme tablosu (KABUL/RET/KISMİ + hedef bölüm + istenen değişiklik + gerekçe + Uygulandı) · ek bulgular · kullanıcı onay checklist'i · (son turda) etki yansıtma sonucu.
