# Playbook Changelog

Bu template kendi sürümünü taşır. Yeni projelerdeki öğrenimler buraya geri akar (00 §K).

**Sürümleme:**
- **Major** — süreç şeklinin değişmesi (aşama ekleme/çıkarma, kapı kaldırma)
- **Minor** — yeni kural, yeni savunma katmanı, yeni skill
- **Patch** — düzeltme, netleştirme, şablon iyileştirmesi

---

## v1.2.0 — 2026-10-18

**Kalite döngüsü tek oturumda dönüyordu.** Şablon model, effort, alt ajan ve oturum bölme hakkında hiçbir şey söylemiyordu; audit → deep-review → cross-review turları → etki yansıtma → checkpoint aynı oturumda yürüyebiliyordu. Bağlam büyüdükçe her tur bütün bağlamı yeniden okur — maliyet tur sayısıyla karesel artar. Gözlenen bir kalite döngüsü adımında bağlam 26k'dan 738k'ya büyüdü ve maliyetin büyük kısmı 400k'nın üstünde harcandı; 218 küçük düzenleme 73 tura yayıldı; kabul edilen bulgular yalnız bağlamda durduğu için otomatik sıkıştırma bir kalite riski oldu. Implementasyonda bu desen zaten yoktu — task ve validate ayrı chat, devir rapor dosyası (`00 §D.2`) — ama doküman dönemine taşınmamıştı.

Bu sürüm **hiçbir kontrolü değiştirmez**: tam okuma kuralları, cross-review çıkış koşulu (`TEMİZ`), adımların sırası ve sayısı aynen kalır. Değişen, adımların hangi bağlamda yürüdüğü ve kararların ne zaman diske indiği.

- **Adım başına taze oturum, devir dosyayla** (`00 §C.5` "Oturum ekonomisi"; ayrıntı skill'lerde) — audit, deep-review, her cross-review turu, düzeltme uygulama, etki yansıtma ve checkpoint ayrı oturumda (ya da taze bağlamlı alt ajanda) yürür. Cross-review tur değerlendiricisine o dokümanın önceki bütün tur raporları girdi olarak verilir; turlar arası RET gerekçeleri tutarlı kalır.
- **"Kararları anında kayıt altına al" kalite döngüsünde adım oldu.** Kural vardı (`INSTRUCTIONS §2`), ama cross-review'da kullanıcı onayının ve düzeltmeye dönüşen kararın rapora ne zaman işleneceği yazılı değildi. Artık her KABUL / RET / KISMİ ve her kullanıcı onayı verildiği anda rapora işlenir.
- **Düzeltme uygulama yöntemi** (cross-review Faz 4.1) — karar satırı hedef bölüm + istenen değişiklik + gerekçeyi tam metin taşır, KISMİ'de alternatifin kendisini; düzeltmeler ayrı oturumda, bölüm sırasıyla, bölüm başına toplu uygulanır ve ardından `00 §C.4`'ün üç kontrolü koşulur. Eksik satır tahminle uygulanmaz.
- **Deep-review çıktısının evi** — `Docs/AUDIT_REPORTS/XX_DEEP_REVIEW.md`. Önceden tanımlı değildi; devir dosyası olmadan adım ayrı oturuma bölünemez.
- **`.claude/agents/`** — üç alt ajan rolü: `mercek` ve `supheci` (opus · high, salt-okur), `mekanik` (haiku · low; yalnız sayma, listeleme, var/yok). Üçü de `omitClaudeMd: true`: oturum başındaki beş dosyalık okuma her alt ajana binmez; bunun yerine rolün uyması gereken kurallar tanımın gövdesinde, kural evine işaretle aktarıldı. `maxTurns` bilinçli olarak yok — sınıra gelen alt ajan yarım sonuç döndürür. Bulgu bulan ve karar veren iş Opus high'da kalır; model değişikliği yalnız ölçülü A/B testiyle, `00 §A.7` yolundan.
- **`CLAUDE.md` "Compact instructions"** — sıkıştırmada açık kararlar, rapor ve karar tablosu yolları ve yürüyen adımın fazı korunur; rapora yazılmamış karar önce yazılır. Tasarruf değil, sigorta.
- **`SETUP §7` oturum ve önbellek notu** — uzun aradan sonra `--resume` yerine taze oturum + devir dosyası; API anahtarıyla insan beklemeli etkileşimli oturumlarda `promptCacheTtl: "1h"` (kişisel ayarda — faturalama türüne bağlı).

Minor sürüm: yeni kural ve yeni L4 bileşeni (`.claude/agents/`) eklendi; süreç şekli değişmedi.

**Ayrıca:**
- `00 §A.4` L4 satırı v1.1.0'dan beri eski yapıyı gösteriyordu (`.claude/skills/*.md`); `<ad>/SKILL.md` ve `.claude/agents/` ile güncellendi. `CLAUDE.md` katman satırı da aynı.
- `.claude/AGENT_ROLES.md` `.claude/` kökünde durduğu için L3'tür (L4 değil); `00 §A.4` L3 satırına eklendi. `CLAUDE.md`'nin L3 tanımı (`.claude/*.md`) onu zaten kapsıyor.
- Damgalar: `00` (v1.0.1 → v1.2.0, header ve footer), `SETUP.md`, `README.md`, `INSTRUCTIONS.md`, `CONTEXT.md`, `checklists/document-stage.md`.

---

## v1.1.0 — 2026-08-01

**Skill'ler gerçekten çağrılabilir hâle geldi.** README ve `INSTRUCTIONS §10` `/task`, `/validate`, `/gate-check` gibi slash command'ler vaat ediyordu; oysa `.claude/skills/*.md` düz markdown dosyalarıydı — frontmatter yok, `<ad>/SKILL.md` yapısı yok, `.claude/commands/` yok. Ajan bunları yalnızca `CLAUDE.md`'yi okuyup dosyaya gittiği için işletiyordu: **konvansiyon olarak** çalışıyor, **mekanizma olarak** çalışmıyordu. Vaat edilen kapı, ajan `CLAUDE.md`'yi atladığı anda yok oluyordu.

Sekiz skill `<ad>/SKILL.md` yapısına taşındı (`git mv` ile geçmiş korunarak) ve `name` / `description` / `user-invocable: true` frontmatter'ı eklendi. Açıklamalar çift tırnaklı — tırnaksız hâli de ayrıştırılıyor, ama bu ayrıştırıcı hoşgörüsüne bağımlılıktır ve açıklamalar `:` içeriyor.

Minor sürüm: yeni kural veya skill eklenmedi, ama L4 katmanının çalışma mekanizması değişti.

**Ayrıca:**
- README ilk cümlesi "13 doküman aşaması" diyordu; `00 §C.1` tablosunda **10** aşama var, 13 ise *doküman* sayısı (00–12). Yeni gelenin okuduğu ilk esaslı cümleydi.
- `SETUP §8`'in (kurulum sonrası doğrulama) ne zaman işletileceği hiç yazmıyordu. §4 Aşama 4'e ertelenebildiği için §8 de otomatik erteleniyordu, ama bu çıkarım okuyucuya bırakılmıştı — şablonun kendi kuralına göre (GUARDRAILS §5) her adım bir kapıya bağlı olmalı. Tetikleyici tanımlandı: `SETUP_COMPLETE=true` günü, ilk implementation task'ından önce.
- Skill dosya yoluna verilen beş referans yeni yapıya güncellendi.

---

## v1.0.3 — 2026-08-01

**Bypass kaydı yanlış commit'i yazıyordu.** `pre-push` `log_bypass()` fonksiyonu `git rev-parse --short HEAD` kullanıyordu; oysa kaydedilmesi gereken **push edilen ref'in tepesi**. Üzerinde durmadığınız bir dalı push etmek olağandır — topic dalındayken `git push origin main`, ya da yeni bir remote'a bootstrap push'u. O durumda kayıt, kapıyı hiç atlamamış bir commit'i işaret ediyordu.

Bir bypass kaydının tek işi **hangi commit'in kapıyı atladığını** söylemektir; yanlış hash o kaydı işlevsiz bırakır. Döngü zaten stdin'den push edilen OID'i okuyordu (`_local_oid`), yalnız kullanılmıyordu — kullanılır hâle getirildi.

Fonksiyonel olarak doğrulandı (izole bare remote, üç senaryo): topic dalındayken `main` push'u artık `main`'in tepesini kaydediyor · üzerinde durduğunuz dalı push etmek regresyona uğramadı · Layer 3 `bundled-pr` yolunda hem hash doğru hem yabancı TXX notu korunuyor.

Bu defektin kendisi v1.0.2'nin yayın push'unda canlı olarak gözlendi.

---

## v1.0.2 — 2026-08-01

Şablonun kendi üzerinde çalıştırılan doğrulama turu sonrası düzeltme.

**Ulaşılamaz kapı kapatıldı:**
- `SETUP §8` Kontrol 7'nin PASS koşulu (`grep` boş dönmeli) yapısal olarak sağlanamıyordu: taranan 36 satırın 27'si tasarım gereği kalıcıydı — desenin *kendisini tarif eden* SETUP satırları, Dönem 3'te dolan `DEBT_CLOSURE_PLAN`, her task'ta dolan `MEMORY.md`, biçim örnekleri. 0. günde boş dönemeyen bir kapı, esnetilmekten başka bir şey yapamaz (00 §A.2). Muafiyet **dosya bazlı** eklendi ve her muaf dosya bir kapıya bağlandı (GUARDRAILS §5); desen jenerik kaldı — muaf olmayan bir dosyaya eklenen yeni yer tutucu ağa takılmaya devam eder.
- `09_CODING_GUIDELINES` §1'deki düz-yazı örneği yer tutucu biçimindeydi ve taramada yanlış pozitif üretiyordu; kaynağında düzeltildi — dosyayı muaf listesine almak, o dosyanın aşama 8'de dolan **gerçek** yer tutucularını da kör ederdi.

**Damga sürüklenmesi:**
- v1.0.1'de içeriği değişen üç dosyanın sürüm/tarih damgası hareket etmemişti: `00` (+51 satır, hâlâ `v1.0` / `2026-07-27`, footer dahil), `SETUP.md` (`v1.0`, README `v1.0.1` derken), `.claude/CONTEXT.md` (`2026-07-27`). Damganın yalan söylemesi INSTRUCTIONS §7'nin yasakladığı şeyin aynası ve 00 §K'nın öğrenim izini dayandırdığı veri.

**Mekanik katman:**
- `.gitattributes` "executable surface" bloğu `pre-commit`'i kapsamıyordu — hook v1.0.1'de eklendi, `.gitattributes` aynı commit'te düzenlendi ama yalnız bir yorum satırı değişti. `git check-attr` kanıtı: `text: auto` (diğer iki hook `text: set`). Pratik risk dardı (`* text=auto eol=lf` yine normalize eder), beyan edilen savunma üç hook'un birinde uygulanmıyordu.

---

## v1.0.1 — 2026-07-30

Bağımsız doğrulama + ikinci tur adversarial inceleme sonrası düzeltme turu.

**Kapatılan kayıp kurallar:**
- Doğrulama matrisine **Durum** sütunu (`BEKLEMEDE / PASS / FAIL / KABUL EDİLMİŞ RİSK`) ve *"ön koşulu sağlanmayan madde BEKLEMEDE kalır"* giriş kuralı — `BEKLEMEDE` bir sonuç olarak kullanılıyor ama tanımlı değildi, dolayısıyla final gate'in *"hiçbir madde beklemede olamaz"* şartı mekanik olarak cevaplanamıyordu
- Matrise **Kanıt ortamı** (mock / sandbox / gerçek) alanı — mock'la ilgili iki sonuç kuralı vardı, ikisinin de dayandığı veriyi üreten kural yoktu
- `.gitignore` sır varsayılanları (`.env` / `.env.*` / `!.env.example`) ve ajan runtime artifact'ı
- Implementation planı traceability matrisine **geri izlenebilirlik** (task → kaynak öğe): kaynağı olmayan task = gerekçesiz iş

**Yeni savunma katmanları:**
- **`pre-commit` sır guard'ı** — staged içerikte sır dosyası yolu, private key bloğu veya bilinen anahtara gerçek değer ataması. Bilinçli olarak jenerik; projeye özgü desenler `hooks.config`'te
- **`core.hooksPath` oturum kapısı** — hook'lar kurulu değilse mekanik katmanın tamamı sessizce yoktur; artık her yapım ve doğrulama oturumunun Adım -1'inde kontrol edilir
- **Gerçek konfigürasyonla boot provası** — faz gate'i "servisleri ayağa kaldır" der ama test konfigürasyonuyla tatmin edilebilir; kapanış ritüelinde gerçek dağıtım konfigürasyonu zorunlu (`00 §L.1`)

**Güçlendirmeler:** ön-uçuş kontrolüne tetikleyici tarama listesi + 5 dk zaman kutusu · secret dağıtım yarıçapı (blast radius) + rotation · süreç baseline valfi · seed edilemeyen kayıt sınıfı ve bootstrap script'i · deep-review güvenlik katmanına OWASP çapası · re-validation sonuç kuralları · `.claude/settings.json` + opsiyonel oturum hook'u katmanı.

**Hijyen:** 7 hedefsiz bölüm/yol referansı kapatıldı · `SETUP` doğrulaması jenerik yer-tutucu desenine çevrildi · `SETUP`'a repo-config ve ikinci-AI atama adımları eklendi.

---

## v1.0 — 2026-07-27

İlk sürüm. Gerçek bir projede fikirden MVP'ye kadar fiilen uygulanan yöntemin konsolide edilmiş hâli.

Lisans: MIT.

**İçerik:**
- **L1** Konsolide metodoloji: doküman üretimi (10 aşama) + implementation + **MVP borç kapatma aşaması** + **ertelenmiş işler disiplini** + kapanış ritüeli + numaralandırma konvansiyonları + **öğrenim terfisi**
- **L2** 12 doküman iskeleti + 8 süreç dosyası + rapor şablonları
- **L3** Çalışma talimatları, guardrail'ler, klasör düzeyi bağlam haritası
- **L4** 8 skill (task · validate · gate-check · audit · deep-review · cross-review · checkpoint · handoff) + doküman aşaması checklist'i + hafıza katmanı
- **L5** Üç katmanlı git hook'ları + CI iskeleti + eksik komut kapısı + PR şablonu

**Kaynak yöntemden düzeltilerek taşınanlar:**
- Ölü prompt kütüphanesi placeholder'ı **taşınmadı**
- Dosya-bazlı bağlam envanteri → **klasör düzeyi harita** (dosya envanteri kaçınılmaz olarak donar)
- Doküman üretim aşamaları için yeni skill icat edilmedi → **checklist** (skill'e dönüştürme ilk gerçek kullanımdan sonra)
- Öğrenim → kural terfisi elle ve tesadüfi olmaktan çıkarıldı → **gate maddesi**

**Kaynak yöntemde geç doğup burada gün 0'da bulunanlar:**
Başlangıç kapıları (working tree / ana dal CI / hafıza drift) · üç katmanlı bundled-PR önlemesi · pre-push CI guard · bypass log · server-side guard job · dış varsayım ön-uçuş kontrolü · 8 maddelik bitiş kapısı · post-merge çok-workflow izleme · CI izleme sorumluluğunun ajanda olması · status/changelog ayrımı · ertelenmiş işler backlog'u · MVP borç kapatma aşaması · runbook katmanı · validator merge yetkisi.
