# Instructions

Read and follow these files at the start of every session:

- `Docs/00_PROJECT_METHODOLOGY.md` — metodoloji: aşamalar, kapılar, konvansiyonlar (L1)
- `.claude/INSTRUCTIONS.md` — çalışma talimatları (L3)
- `.claude/GUARDRAILS.md` — sınırlar ve yasaklar (L3)
- `.claude/CONTEXT.md` — proje bağlamı ve klasör haritası (L3)
- `.claude/memory/MEMORY.md` — proje hafızası (L4)

## Oturum başlangıcı (istisnasız)

1. `git status --short` — working tree dirty ise **dur**, karar al (INSTRUCTIONS §3.0)
2. Bir task veya doğrulama başlatılacaksa ilgili skill'in başlangıç kapılarını işlet (`.claude/skills/`)
3. Durum sorusu geldiyse `Docs/IMPLEMENTATION_STATUS.md`'yi oku — hafıza snapshot'ı otoriter değildir

## Kural katmanları

Her kuralın tek bir evi vardır: **L1** metodoloji · **L2** `Docs/01`–`12` · **L3** `.claude/*.md` · **L4** `.claude/skills/`, `.claude/agents/` ve `.claude/memory/` · **L5** `scripts/git-hooks/`, `.github/workflows/`.

Bir süreç kuralı yalnızca hafızada yaşıyorsa **kırılgandır** — L1–L5'e terfi eder (00 §K).

## Compact instructions

Bağlam sıkıştırılırken şunlar korunur:

- **Açık kararlar** — verilmiş ama henüz uygulanmamış ya da kullanıcı onayı bekleyen her KABUL / RET / KISMİ ve workshop kararı
- **Dosya yolları** — yürüyen adımın raporu ve karar tablosu (ör. `Docs/CROSS_REVIEW_REPORTS/XX_CROSS_REVIEW_R3.md`, `Docs/AUDIT_REPORTS/`, `Docs/PRODUCT_DISCOVERY_STATUS.md`)
- **Konum** — hangi adım, hangi faz (ör. "05 cross-review R3, Faz 3 — kullanıcı kararı bekleniyor")

Rapora yazılmamış bir karar varsa **önce rapora yaz**: elle sıkıştırmadan önce yazılır; otomatik sıkıştırmada özette "rapora yazılmadı" diye işaretlenir ve sıkıştırmadan sonraki ilk iş olarak yazılır (gerekçe: 00 §C.5).

## Dil

Dokümanlar, tartışmalar ve raporlar **Türkçe**. Kod, kod yorumları ve sembol adları **İngilizce**. Bu bir parametre değil, sabittir.

## Kurulum

Yeni bir projede ilk iş: [`SETUP.md`](SETUP.md).
