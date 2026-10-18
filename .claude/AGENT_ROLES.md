# Alt Ajan Rolleri

**Katman:** L3 | **Son güncelleme:** 2026-10-18

> Bir adım alt ajanlara bölündüğünde kullanılacak sabit roller. Bu tanımlar bir adımın **kaç** alt ajana bölüneceğini belirlemez; yalnız her rolün **nasıl** çalıştığını tanımlar. Adımların kendisi skill'lerdedir.

---

## Hangi iş hangi role

| Rol | Dosya | Ne iş verilir | model · effort | Araçlar |
|---|---|---|---|---|
| **mercek** | [`mercek.md`](agents/mercek.md) | Bir dokümanı tek bir bakış açısıyla tarayıp bulgu çıkarmak — deep-review katmanı, audit envanter bölümü, verilen odak | opus · high | Read, Grep, Glob |
| **şüpheci** | [`supheci.md`](agents/supheci.md) | Merceklerin bulgularını kaynağa dönüp doğrulamak; yanlış pozitif ve yanlış seviye süzgeci | opus · high | Read, Grep, Glob |
| **mekanik** | [`mekanik.md`](agents/mekanik.md) | Sayma, listeleme, var/yok — sonucu sayıyla doğrulanabilen iş | haiku · low | Read, Grep, Glob, Bash |

**Ayrım:** Bulgu bulan ya da karar veren işte zayıf bir model bir bulguyu kaçırabilir ve kaçan bulgu sonraki aşamalarda çok daha pahalıya döner. Mekanik işte doğruluk sayıyla ya da sonraki adımla denetlenir.

- **Bulgu bulan ve karar veren iş Opus high'da kalır** — hangi oturumda yürürse yürüsün: mercek, şüpheci, audit eşleştirme ve analizi, cross-review değerlendirmesi, düzeltme uygulama (normatif metin üretir), etki yansıtma, checkpoint, `/validate`, gate verdict'i.
- **Mekanik role** yalnız sonucu deterministik iş verilir. Yargı gerektiren bir alt soru mekanik role bölünmez.

## Model değişikliği

Bir rolün modeli ya da effort'u **ancak ölçülü bir A/B testiyle** değişir: temel kol (Opus high) ile aynı test kümesinde karşılaştırılır ve kayıp gösterilmezse. Değişiklik 00 §A.7 yolundan geçer — gözlem kanıtıyla, faz gate'inin öğrenim terfisi adımında; oturum ortasında, "bu sefer yeter" diye değil.

Tanımı ezen yollar kullanılmaz:
- Agent çağrısına `model` ya da `effort` parametresi verilmez — frontmatter'ı ezer.
- `CLAUDE_CODE_EFFORT_LEVEL` ve `CLAUDE_CODE_SUBAGENT_MODEL_FORCE` ortam değişkenleri kullanılmaz — her rolü tek değere zorlar.

## Tanımlardaki iki bilinçli seçim

**`omitClaudeMd: true`** — alt ajan proje ve kullanıcı `CLAUDE.md`'sini yüklemez; oturum başındaki beş dosyalık okuma her alt ajana ayrıca binmez. Bedeli: `CLAUDE.md`'den gelen kurallar gelmez. Bu yüzden rolün uyması gereken kurallar (dil, kanıt standardı, seviye tanımları, rubber stamp yasağı, önce oku sonra yargıla, tam okuma) tanımın gövdesinde, kural evine işaretle aktarılmıştır. Claude Code v2.1.271+ gerekir; eski sürümde alan etkisizdir.

**`maxTurns` yok** — sınıra gelen alt ajan yarım sonuç döndürür. İşini bitirmemiş bir mercek, kaçan bulgu demektir.

## Bakım

Aktarılan bir kuralın evi değişirse (ör. audit veya deep-review seviye tanımları) `mercek.md` ve `supheci.md`'deki aktarım **aynı değişiklikte** güncellenir — iki yerde farklı anlatılan kural yasaktır (INSTRUCTIONS §7).
