# maliyet.mjs: oturum maliyeti tahmini

Claude Code'un yerel oturum kayıtlarından (`~/.claude/projects/<proje-klasörü>/*.jsonl` ve varsa `<oturum-id>/subagents/*.jsonl`) oturum başına kullanımı (girdi, önbellek okuma/yazma, çıktı) ve tahmini dolar maliyetini çıkarır. Node 18+, bağımlılık yok.

> İstemci tarafı tahmin; kesin fatura Console'da.

## Çalıştırma

```
node scripts/maliyet/maliyet.mjs                      # bu reponun kayıtları, yalnız stdout
node scripts/maliyet/maliyet.mjs --since 2026-10-01   # bu tarihten sonra başlayan oturumlar
node scripts/maliyet/maliyet.mjs --json               # JSON çıktı
node scripts/maliyet/maliyet.mjs --out                # .metrics/maliyet-<tarih>.md dosyasına yaz
node scripts/maliyet/maliyet.mjs --out rapor.md       # belirtilen dosyaya yaz
node scripts/maliyet/maliyet.mjs --dir "C:\Users\<kullanıcı>\.claude\projects\C--Projects-x"
```

Kayıt klasörü adı çalışma dizininden türetilir (harf/rakam dışındaki her karakter `-` olur: `C:\Projects\x` -> `C--Projects-x`). Bulunamazsa `--dir` ile verin. `.metrics/` `.gitignore`'dadır.

## Ne hesaplar

- Aynı `message.id` birden çok satırda tekrarlanır; tekilleştirilir (alt ajan kayıtları dahil, tüm oturumlar arasında).
- Maliyet: input, cache okuma, cache yazma (5 dk ve 1 sa ayrı fiyat), output. Fiyat tablosu betiğin başındadır, kaynak: https://platform.claude.com/docs/en/about-claude/pricing . Fiyatlar değişince tabloyu elle güncelleyin. Bilinmeyen model uyarı verir ve "fiyatsız" sayılır.
- Haiku 5.5 için kademe, mesaj başına bağlama (input + cache okuma + cache yazma) göre seçilir (100K sınırı).
- Adım etiketi: oturumun ilk kullanıcı mesajında `/audit`, `/deep-review`, `/cross-review`, `/checkpoint`, `/task`, `/validate`, `/gate-check`, `/handoff` geçiyorsa o, yoksa "diğer". Hedef: mesajdaki `TXX` ve "belge N" ifadeleri.
- Çıktı: adım türüne göre toplam tablosu, oturum başına satır (model kırılımı, okuma/yazma/çıktı miktarı, tahmini $, ana/alt ajan payı, ana ajanın en yüksek bağlamı). "İstemci $" sütunu oturumdaki son `cost-state` kaydıdır (varsa) ve çapraz kontrol içindir.

## Sınırlar

- Oturum kayıtlarının biçimi resmî bir sözleşme değildir, Claude Code sürümüyle değişebilir. Beklenen alanlar (`message.id`, `message.model`, `message.usage`) değişirse betik yanlış ya da eksik sayabilir; sayıları şüpheli bulursanız önce biçimi kontrol edin.
- Yalnız yerel makinedeki kayıtları görür; başka makinede, silinmiş ya da temizlenmiş kayıtlar yoktur.
- Tahmin; indirim, kredi, ek ücretli özellikler (web araması vb.), uzun bağlam katmanları ya da fiyat değişiklikleri fatura ile farklılık yaratabilir.
- Tarih, oturumdaki ilk kaydın UTC tarihidir. Uzun ya da devam ettirilen (`--resume`) oturum ilk günün satırına yazılır.
- Adım etiketi sezgiseldir: oturumun ilk mesajına bakar. Bir oturumda birden çok adım çalıştırılmışsa yalnız ilki sayılır.
- Resmî alternatifler: OpenTelemetry (https://code.claude.com/docs/en/monitoring-usage). `claude -p --output-format json` çıktısındaki `total_cost_usd` `--resume` ile devam eden oturumlarda birikimlidir, çıktıları toplamayın (https://code.claude.com/docs/en/headless).

## Nasıl okunmalı

Maliyet tek başına bir hedef değildir. Ucuz ama kötü sonuç (daha çok tekrar, kaçan hata) pahalıdır. Rakamları kalite göstergeleriyle birlikte okuyun: bulunan/kaçan hata sayısı, yeniden çalıştırma ve düzeltme turları, kapıdan geçme oranı. Bir adımın payı yüksekse önce o adımın çıktısının değerine bakın, sonra düşürmeyi düşünün.
