# Lumino AI — Proje Rehberi

## Ders Bağlamı
- **Üniversite:** Hochschule Bonn-Rhein-Sieg
- **Ders:** Digital Start-up (Prof. Christoph Wamser)
- **Amaç:** Dijital girişim pitch'i ödev sunumu
- **Pitch Hedefi:** HTGF (High-Tech Gründerfonds) seed yatırım sunumu simülasyonu

---

## Ürün: Ne?

Lumino AI, Voice (sesli) yapay zeka ile iş hayatındaki stresli konuşmaları simüle eden bir mobil kariyer koçluğu uygulamasıdır.

**Kullanıcı ne yapar?**
- Telefon üzerinden AI ile gerçek zamanlı sesli konuşma yapar
- AI, HR Direktörü / müdür / müzakereci rolü oynar
- Kullanıcı iş görüşmesi, maaş müzakeresi, performans değerlendirmesi gibi zor senaryoları pratik yapar
- CV yükleyince AI, CV'deki boşluklara yönelik stres soruları sorar (RAG)

---

## Problem: Neden?

**Kök neden (Five Whys):** Uygun fiyatlı, dinamik, aktif müzakere eğitimi için bir "sandbox" yok.

- Üniversitelerde soft skill'ler sadece teorik öğretiliyor
- Gerçek executive koçlar >200€/saat — junior'lar için ekonomik değil
- E-learning pasif kalıyor, duygusal stres direnci oluşturmuyor
- ChatGPT gibi genel AI botları yapılandırılmış framework içermiyor

---

## Hedef Kitle

| Segment | Tanım |
|---|---|
| B2C (Primer) | Young Professionals (25-35 yaş), üniversite mezunları, içe dönük kişiler, Imposter Sendromu yaşayanlar |
| B2B (Sekonder) | HR departmanları (onboarding), üniversite kariyer merkezleri (kampüs lisansları) |

**Persona:** Julian (28) — Master mezunu, 2 yıl ajans deneyimi, Imposter Sendromu, micro-learning ihtiyacı.

---

## Ürün Özellikleri

1. **Voice AI Roleplay** — Gerçek zamanlı sesli konuşma simülasyonu
2. **Çoklu Senaryo** — HR görüşmesi, maaş müzakeresi, performans değerlendirmesi
3. **CV Upload + RAG** — PDF CV yükle, AI CV boşluklarına yönelik stres soruları sorsun
4. **Gamification** — Streaks, rozetler, mobile-first tasarım
5. **Analitik** — Dolgu kelimeleri, konuşma hızı, objektif soft skill analizi
6. **Psikolojik Framework** — Harvard Müzakere Konsepti + NLP system prompt'lara gömülü

---

## Teknik Mimari (Planlanan)

- **LLM Provider:** OpenAI / Anthropic API (Voice/Audio LLM)
- **RAG:** CV PDF → vektör veritabanı → bağlama özgü sorular
- **Platform:** iOS + Android mobil uygulama
- **Kritik KPI:** Gecikme (latency) < 1 saniye (konuşma immersion'ı için zorunlu)
- **Test Bulgusu:** >1.5s gecikme konuşma deneyimini tamamen bozuyor

---

## İş Modeli

| Katman | Detay |
|---|---|
| Freemium | Temel senaryolar ücretsiz (pazar penetrasyonu + veri toplama) |
| B2C SaaS | "Lumino Pro" — 14,99€/ay (CV upload + derin analiz) |
| B2B Enterprise | Kurumsal trainee programları için lisans (gelecek faz) |

---

## Pazar Büyüklüğü (EdTech DACH)

- **TAM:** 2,5 milyar € (tüm EdTech pazarı)
- **SAM:** 800 milyon € (Soft-Skill & Coaching)
- **SOM:** 50 milyon € (Y1-Y3 ulaşılabilir B2C app kullanıcıları)

---

## Roadmap 2026/27

| Dönem | Hedef |
|---|---|
| Q1 2026 | MVP Launch — HR mülakat modülü (early adopters) |
| Q2 2026 | Beta Test — 500 üniversite mezunu, gecikme optimizasyonu |
| Q3 2026 | "Lumino Pro" SaaS Launch — CV upload (RAG), maaş modülü |
| Q1 2027 | B2B expansion, break-even |

---

## Finansman

- **Hedef:** 600.000€ seed yatırım (HTGF)
- **Karşılık:** %15 hisse
- **Kullanım:**
  - %50 → Ürün & AI Teknolojisi (RAG/Voice)
  - %30 → Marketing & Sales (CAC düşürme)
  - %20 → Operasyon, Hukuk (GDPR), Rezerv

---

## Riskler

| Risk | Önlem |
|---|---|
| Gecikme / AI Hallucination | Edge-AI değerlendirme, sıkı system prompting |
| GDPR (ses + CV verisi 3. taraf sunucularda) | Zero-data-retention sözleşmeler, AB'de hosting |
| Big Tech taklit riski | Proprietary B2B ağları, koç veri seti, community moat |

---

## Rekabet Konumu

**"Orta" strateji:** Pahalı insan executive koç ile yapılandırılmamış ChatGPT arasındaki boşluğu doldur.

**USP:** Aktif konuşma vs. pasif tüketim. Multiple choice yok. Öngörülemeyen, duygusal ses simülasyonu gerçek bilişsel stres direnci oluşturur.

---

## İnovasyon Tipi (Gerpott)

**Disruptif Ürün İnovasyonu:**
- Pull Innovation: Müşterinin stres azaltma talebi
- Technology Push: Hızlı LLM Audio API'larının kullanılabilirliği

---

## Notlar (Geliştirme İçin)

- Proje henüz kod aşamasında değil — fikir ve slayt aşamasında
- Önce fikri netleştirmek, sonra hayata geçirmek planı
- Kullanıcı: ironkemal5@gmail.com
