# <PROJE> — Deploy Runbook

**Son güncelleme:** YYYY-AA-GG | **Durum:** ⬚ Doldurulmayı bekliyor

> **Ne zaman doldurulur:** Entegrasyon fazından itibaren parça parça; **kapanış ritüelinde finalize edilir** (00 §L adım 5).
>
> **Bu dokümanın varlık sebebi:** Kod tamam olsa bile, prod'da bir ayar eksikse sistem ya **hiç açılmaz** ya da bir kural **sessizce devre dışı kalır**. İkinci durum tehlikelidir çünkü hiçbir test bunu yakalamaz — yalnız bu doküman yakalar.

---

## 0. Hızlı özet

| Soru | Cevap |
|---|---|
| Sistem hangi ayarlar olmadan **açılmaz**? | §A |
| Hangi secret'lar **zorunlu**? | §B |
| Hangi ayarlar set edilmezse bir kural **sessizce devre dışı kalır**? | §C ⚠ |
| Hangi ayarlar yeniden başlatma gerektirir? | §D |
| Hangileri çalışırken değiştirilebilir? | §E |
| Deploy sonrası ne doğrulanır? | §F |

---

## A. Zorunlu ayarlar (yoksa sistem açılmaz)

> **Kaynak:** `06_DATA_MODEL.md` §8 fail-fast listesi.
> Bunlar bilinçli olarak varsayılan değer **taşımaz** — iş-kritik bir değerin sessizce yanlış varsayılanla çalışması, açılmamasından daha tehlikelidir.

| # | Ayar | Tip | Örnek değer | Ne işe yarar |
|---|---|---|---|---|

## B. Operasyonel secret'lar (zorunlu)

| # | Secret | Nereden alınır | Runbook |
|---|---|---|---|

## C. ⚠ Prod'da ayarlanması gereken ayarlar (yoksa kural sessiz kalır)

> **En kritik bölüm.** Buradaki bir ayar eksikse sistem sorunsuz açılır, testler geçer, ama bir iş kuralı **hiç çalışmaz**.
> Her satır için: varsayılan neden yetersiz + hangi kuralın devre dışı kalacağı.

| # | Ayar | Varsayılan | Varsayılanla ne olur | Prod'da ne olmalı |
|---|---|---|---|---|

## D. Bileşenler arası konfigürasyon eşleşmesi

> **Ne yazılır:** Aynı değerin birden fazla yerde tanımlandığı durumlar (ör. bir zamanlama aralığı hem arka planda hem yardımcı serviste). Hangisi otoriter, değişince ne yeniden başlatılmalı.

| Ayar | Nerelerde tanımlı | Otoriter olan | Değişince |
|---|---|---|---|

## E. Çalışırken değiştirilebilen ayarlar

| # | Ayar | Etki süresi | Not |
|---|---|---|---|

## F. Deploy sonrası doğrulama

- [ ] Sağlık uçları yanıt veriyor
- [ ] Zorunlu ayarların hepsi yüklü (§A)
- [ ] §C ayarları **açıkça** kontrol edildi (varsayılanda kalan yok)
- [ ] Arka plan işleri kayıtlı ve çalışıyor
- [ ] Dış entegrasyonlar canlı uçlara bağlanabiliyor
- [ ] Loglar akıyor, uyarı kanalı çalışıyor
- [ ] Geri alma (rollback) yolu denendi

## G. Geri alma

> **Ne yazılır:** Bir deploy geri alınacaksa hangi adımlar; şema değişikliği geri alınabilir mi, alınamıyorsa ne yapılır.
