# Playbook Changelog

Bu template kendi sürümünü taşır. Yeni projelerdeki öğrenimler buraya geri akar (00 §K).

**Sürümleme:**
- **Major** — süreç şeklinin değişmesi (aşama ekleme/çıkarma, kapı kaldırma)
- **Minor** — yeni kural, yeni savunma katmanı, yeni skill
- **Patch** — düzeltme, netleştirme, şablon iyileştirmesi

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
