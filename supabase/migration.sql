-- ============================================================
-- Kişisel Akıllı Fitness & PT Platformu (Lumino Re-Platforming)
-- Supabase Migration & Seed Data
-- ============================================================

-- 1. ESKİ TABLOLARI TEMİZLE (Interview/Lumino v1 temizliği)
DROP TABLE IF EXISTS public.session_analysis CASCADE;
DROP TABLE IF EXISTS public.todos CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.cv_data CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Mevcut fitness tabloları varsa temizle
DROP TABLE IF EXISTS public.ai_coach_logs CASCADE;
DROP TABLE IF EXISTS public.body_metrics CASCADE;
DROP TABLE IF EXISTS public.set_logs CASCADE;
DROP TABLE IF EXISTS public.workout_sessions CASCADE;
DROP TABLE IF EXISTS public.routine_exercises CASCADE;
DROP TABLE IF EXISTS public.workout_routines CASCADE;
DROP TABLE IF EXISTS public.exercises CASCADE;

-- ============================================================
-- 2. TABLO TANIMLARI
-- ============================================================

-- 2.1 Egzersiz Kütüphanesi
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  target_muscle TEXT NOT NULL, -- 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'
  equipment TEXT DEFAULT 'Dumbbell', -- 'Dumbbell', 'Bodyweight', 'Ab-Wheel', 'Pull-up Bar'
  default_rest_seconds INT DEFAULT 90,
  instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 Dinamik Rutinler
CREATE TABLE public.workout_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- 'İtiş A', 'Çekiş A', 'Bacak & Core', 'İtiş B', 'Çekiş B'
  sequence_order INT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 Rutin Egzersiz Eşleşmeleri (Hedef Parametreler)
CREATE TABLE public.routine_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES public.workout_routines(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  order_in_routine INT NOT NULL,
  target_sets INT NOT NULL DEFAULT 3,
  target_reps TEXT NOT NULL DEFAULT '8-12',
  target_weight_kg NUMERIC(4,1) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.4 Antrenman Seansları
CREATE TABLE public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID REFERENCES public.workout_routines(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  rpe_score INT CHECK (rpe_score BETWEEN 1 AND 10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.5 Set Logları (Anlık Gerçekleşen Veriler)
CREATE TABLE public.set_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  set_number INT NOT NULL,
  actual_reps INT NOT NULL,
  actual_weight_kg NUMERIC(4,1) NOT NULL,
  completed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.6 Vücut Kompozisyonu ve Mezura Ölçümleri
CREATE TABLE public.body_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recorded_at DATE DEFAULT CURRENT_DATE NOT NULL,
  weight_kg NUMERIC(4,1) NOT NULL,
  waist_cm NUMERIC(4,1), -- Göbek deliği hizası
  arm_cm NUMERIC(4,1),   -- Soğuk / Sıkılı
  chest_cm NUMERIC(4,1), -- Göğüs
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.7 AI Antrenör Geri Bildirimleri ve Program Revizyonları
CREATE TABLE public.ai_coach_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  evaluation_summary TEXT NOT NULL,
  suggested_changes JSONB,
  applied BOOLEAN DEFAULT FALSE
);

-- ============================================================
-- 3. PERFORMANS İNDEKSLERİ
-- ============================================================
CREATE INDEX idx_routine_exercises_routine_id ON public.routine_exercises(routine_id);
CREATE INDEX idx_workout_sessions_completed_at ON public.workout_sessions(completed_at DESC);
CREATE INDEX idx_set_logs_session_id ON public.set_logs(session_id);
CREATE INDEX idx_set_logs_exercise_id ON public.set_logs(exercise_id);
CREATE INDEX idx_body_metrics_recorded_at ON public.body_metrics(recorded_at DESC);
CREATE INDEX idx_ai_coach_logs_created_at ON public.ai_coach_logs(created_at DESC);

-- ============================================================
-- 4. ROW LEVEL SECURITY (RLS) - Anon erişim açık (PIN güvenliği uygulama katmanında)
-- ============================================================
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.set_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_coach_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public full access on exercises" ON public.exercises FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on workout_routines" ON public.workout_routines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on routine_exercises" ON public.routine_exercises FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on workout_sessions" ON public.workout_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on set_logs" ON public.set_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on body_metrics" ON public.body_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on ai_coach_logs" ON public.ai_coach_logs FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 5. BAŞLANGIÇ TOHUM (SEED) VERİLERİ
-- ============================================================

-- 5.1 Egzersizler
INSERT INTO public.exercises (id, name, target_muscle, equipment, default_rest_seconds, instructions) VALUES
-- Göğüs & Omuz & Triceps (İtiş)
('10000000-0000-0000-0000-000000000001', 'Dumbbell Floor Press / Bench Press', 'Chest', 'Dumbbell', 90, 'Yere veya düz sehpaya uzanın. Dambılları göğüs hizasından yukarı kontrollü basın, tepe noktada sıkın.'),
('10000000-0000-0000-0000-000000000002', 'Incline Dumbbell Press (Yastık/Minder Destekli)', 'Chest', 'Dumbbell', 90, 'Üst göğüs odaklı, 30-45 derece açıyla basınç uygulayın.'),
('10000000-0000-0000-0000-000000000003', 'Dumbbell Shoulder Press (Oturarak/Ayakta)', 'Shoulders', 'Dumbbell', 90, 'Dambılları omuz hizasından yukarı presleyin. Belinizi kavis yapmayın, merkez bölgeyi sıkın.'),
('10000000-0000-0000-0000-000000000004', 'Dumbbell Lateral Raise', 'Shoulders', 'Dumbbell', 60, 'Yan omuz izolasyonu. Dirsekleri hafif kırık tutarak dambılları yana omuz hizasına kaldırın.'),
('10000000-0000-0000-0000-000000000005', 'Dumbbell Overhead Triceps Extension', 'Arms', 'Dumbbell', 60, 'Tek veya çift elle dambılı baş arkasına indirin ve dirsekleri kilitlemeden yukarı itin.'),
('10000000-0000-0000-0000-000000000006', 'Şınav (Push-Up / Diamond Push-Up)', 'Chest', 'Bodyweight', 60, 'Vücut düz çizgi halinde, göğüs ve triceps odaklı tempo ile yapın.'),

-- Sırt & Biceps & Arka Omuz (Çekiş)
('10000000-0000-0000-0000-000000000007', 'Pull-Up (Barfiks - Geniş/Normal Tutuş)', 'Back', 'Pull-up Bar', 120, 'Geniş kanat gelişimi için dikey çekiş. Göğsü bara yaklaştırın, kürek kemiklerini sıkıştırın.'),
('10000000-0000-0000-0000-000000000008', 'Chin-Up (Barfiks - Avuç İçi Bize Dönük)', 'Back', 'Pull-up Bar', 90, 'Lat ve biceps aktivasyonu yüksek çekiş. Tam hareket aralığı uygulayın.'),
('10000000-0000-0000-0000-000000000009', 'Tek Kol Dumbbell Row', 'Back', 'Dumbbell', 75, 'Dizi bir sehpaya/koltuğa dayayın. Dambılı cep hizasına doğru çekerek kanat kasını sıkın.'),
('10000000-0000-0000-0000-000000000010', 'Çift Kol Dumbbell Row (Chest-Supported/Bent-Over)', 'Back', 'Dumbbell', 90, 'Öne eğilip sırtı düz tutarak dambılları karna doğru çekin.'),
('10000000-0000-0000-0000-000000000011', 'Dumbbell Biceps Curl', 'Arms', 'Dumbbell', 60, 'Kolları gövdeye sabitleyerek dambılları yukarı curl yapın, tepe noktada bileği hafif dışa çevirin.'),
('10000000-0000-0000-0000-000000000012', 'Dumbbell Hammer Curl', 'Arms', 'Dumbbell', 60, 'Avuçlar birbirine bakacak şekilde (nötr tutuş) curl yapın. Brachialis ve ön kol gelişimi sağlar.'),
('10000000-0000-0000-0000-000000000013', 'Rear Delt Fly (Eğilerek Yan Omuz/Sırt)', 'Shoulders', 'Dumbbell', 60, 'Öne eğilerek arka omuz ve üst sırt için dambılları yana açın.'),

-- Bacak & Core
('10000000-0000-0000-0000-000000000014', 'Goblet Squat (Dambıl ile)', 'Legs', 'Dumbbell', 90, 'Dambılı göğüs önünde dikey tutarak derin squat yapın. Gövdeyi dik tutun.'),
('10000000-0000-0000-0000-000000000015', 'Bulgarian Split Squat', 'Legs', 'Dumbbell', 90, 'Bir ayağı arkadaki sandalye/sehpaya koyun. Ön bacak üzerinde çömelin. Yüksek hipertrofi.'),
('10000000-0000-0000-0000-000000000016', 'Romanian Deadlift (Dumbbell RDL)', 'Legs', 'Dumbbell', 90, 'Kalçayı geriye iterek hamstring ve glute kaslarını esnetin, sırt düz omurga nötr.'),
('10000000-0000-0000-0000-000000000017', 'Dumbbell Calf Raise', 'Legs', 'Dumbbell', 60, 'Dambıllar elde parmak ucuna yükselin, tepe noktada 1 saniye bekleyip yavaşça inin.'),
('10000000-0000-0000-0000-000000000018', 'Ab-Wheel Rollout (Diz Üstü)', 'Core', 'Ab-Wheel', 75, 'Dizlerin üzerinde tekeri kontrollü ileri itin, belinizi çökertmeden karın gücüyle geri çekin.'),
('10000000-0000-0000-0000-000000000019', 'Hanging Leg / Knee Raise (Barfikste)', 'Core', 'Pull-up Bar', 60, 'Barfiks barında asılı kalın, dizleri veya bacakları göğse çekin. Salınımı engelleyin.'),
('10000000-0000-0000-0000-000000000020', 'Plank / Side Plank', 'Core', 'Bodyweight', 45, 'Merkez bölgeyi kitleyerek sabit durun.');

-- 5.2 Rutinler (Dinamik Döngü: İtiş A -> Çekiş A -> Bacak & Core -> İtiş B -> Çekiş B)
INSERT INTO public.workout_routines (id, name, sequence_order, description, is_active) VALUES
('20000000-0000-0000-0000-000000000001', 'İtiş A (Göğüs - Omuz - Triceps)', 1, 'Ağır dambıl göğüs presi ve omuz kuvveti odaklı seans', true),
('20000000-0000-0000-0000-000000000002', 'Çekiş A (Sırt - Biceps - Arka Omuz)', 2, 'Barfiks dikey çekiş ve tek kol ağır dambıl row seansı', true),
('20000000-0000-0000-0000-000000000003', 'Bacak & Core (Kuvvet & Karın)', 3, 'Goblet squat, RDL ve Ab-Wheel rollout seansı', true),
('20000000-0000-0000-0000-000000000004', 'İtiş B (Hipertrofi & Hacim)', 4, 'Incline press, lateral raise ve şınav süpersetleri', true),
('20000000-0000-0000-0000-000000000005', 'Çekiş B (Kanat & Kol Yoğunluğu)', 5, 'Chin-up, çift kol row ve yoğun biceps/hammer curl', true);

-- 5.3 Rutin Egzersiz Eşleştirmeleri
-- Rutin 1: İtiş A
INSERT INTO public.routine_exercises (routine_id, exercise_id, order_in_routine, target_sets, target_reps, target_weight_kg, notes) VALUES
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 1, 4, '8-10', 20.0, 'Son sette tükenişe 1 tekrar kala bırakın.'),
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 2, 3, '8-12', 15.0, 'Omuz hizasından tam kontrol.'),
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 3, 4, '12-15', 7.5, 'Dirsekler hafif bükülü, tepe noktada sık.'),
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 4, 3, '10-12', 17.5, 'Tek dambıl ile baş arkasına uzatış.'),
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000006', 5, 2, '15-20', 0.0, 'Bitirici set olarak şınav.');

-- Rutin 2: Çekiş A
INSERT INTO public.routine_exercises (routine_id, exercise_id, order_in_routine, target_sets, target_reps, target_weight_kg, notes) VALUES
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000007', 1, 4, '5-8', 0.0, 'Geniş tutuş barfiks, gerekirse negatif tekrar ekleyin.'),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000009', 2, 4, '8-10', 22.5, 'Ağır dambıl ile kanatları tam esnetip çekin.'),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000013', 3, 3, '12-15', 7.5, 'Arka omuz kontrolü.'),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000011', 4, 3, '10-12', 12.5, 'Dumbbell curl, kontrollü negatif iniş.'),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000012', 5, 3, '10-12', 12.5, 'Hammer curl ile ön kol ve brachialis.');

-- Rutin 3: Bacak & Core
INSERT INTO public.routine_exercises (routine_id, exercise_id, order_in_routine, target_sets, target_reps, target_weight_kg, notes) VALUES
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000014', 1, 4, '10-12', 24.5, 'En ağır dambıl ile derin goblet squat.'),
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000016', 2, 4, '10-12', 20.0, 'RDL ile arka bacak ve glute yüklemesi.'),
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000015', 3, 3, '8-10', 12.5, 'Her bacak için tek tek tamamlayın.'),
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000018', 4, 4, '10-15', 0.0, 'Ab-wheel ile kontrollü anti-extension.'),
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000019', 5, 3, '12-15', 0.0, 'Barfiks barında hanging knee raise.');

-- Rutin 4: İtiş B
INSERT INTO public.routine_exercises (routine_id, exercise_id, order_in_routine, target_sets, target_reps, target_weight_kg, notes) VALUES
('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 1, 4, '10-12', 17.5, 'Incline press ile üst göğüs vurgusu.'),
('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 2, 4, '12-15', 7.5, 'Lateral raise kontrollü tempo.'),
('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 3, 3, '10-12', 17.5, 'Düz zemin press.'),
('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000005', 4, 3, '12-15', 15.0, 'Triceps izolasyonu.'),
('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000020', 5, 3, '45-60sn', 0.0, 'Plank stabilizasyon.');

-- Rutin 5: Çekiş B
INSERT INTO public.routine_exercises (routine_id, exercise_id, order_in_routine, target_sets, target_reps, target_weight_kg, notes) VALUES
('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000008', 1, 4, '6-8', 0.0, 'Chin-up (biceps ve alt lat odaklı).'),
('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000010', 2, 4, '10-12', 17.5, 'Bent-over çift dambıl row.'),
('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000012', 3, 3, '10-12', 12.5, 'Hammer curl.'),
('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000013', 4, 3, '15', 7.5, 'Rear delt fly.'),
('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000018', 5, 3, '12-15', 0.0, 'Ab-wheel karın çalışması.');

-- 5.4 Başlangıç Vücut Ölçümü (Referans Kayıt: 100 kg, 1.80m)
INSERT INTO public.body_metrics (recorded_at, weight_kg, waist_cm, arm_cm, chest_cm, notes) VALUES
(CURRENT_DATE - INTERVAL '14 days', 100.8, 102.0, 39.5, 112.0, 'Başlangıç ölçümü'),
(CURRENT_DATE - INTERVAL '10 days', 100.4, 101.5, 39.5, 112.0, 'Sabah aç karnına'),
(CURRENT_DATE - INTERVAL '7 days', 100.1, 101.0, 39.7, 112.5, '1. Hafta değerlendirme'),
(CURRENT_DATE - INTERVAL '3 days', 99.8, 100.5, 40.0, 112.5, 'Recomposition başlıyor'),
(CURRENT_DATE, 99.6, 100.0, 40.0, 113.0, 'Son tartım');

-- 5.5 Örnek AI Koç Başlangıç Tavsiyesi
INSERT INTO public.ai_coach_logs (evaluation_summary, suggested_changes, applied) VALUES
('İlk 2 haftalık trend analizi: Kilonuz 100.8 kg''dan 99.6 kg''a inerken bel ölçünüz 102 cm''den 100 cm''e geriledi. Kol ölçüsü 40 cm seviyesine çıktı. Bu durum mükemmel bir Body Recomposition (yağ kaybı + kas kazanımı) işaretidir. Dambıl Floor Press ve Row hareketlerinde ağırlıkları 1 kademe artırmaya hazırsınız.',
'{"recommendations": [{"exercise": "Dumbbell Floor Press", "action": "increase_weight", "old_val": "20.0 kg", "new_val": "22.5 kg"}, {"exercise": "Pull-Up", "action": "increase_reps", "old_val": "5-8", "new_val": "6-9"}]}'::jsonb,
true);
