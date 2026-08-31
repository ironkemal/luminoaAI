-- ============================================================
-- Kişisel & Çok Kullanıcılı Akıllı Fitness & PT Platformu
-- (Davetiye PIN: 4004 Korumalı Çoklu Kullanıcı Şeması)
-- ============================================================

-- 1. TABLOLARI TEMİZLE
DROP TABLE IF EXISTS public.ai_coach_logs CASCADE;
DROP TABLE IF EXISTS public.progress_photos CASCADE;
DROP TABLE IF EXISTS public.body_metrics CASCADE;
DROP TABLE IF EXISTS public.set_logs CASCADE;
DROP TABLE IF EXISTS public.workout_sessions CASCADE;
DROP TABLE IF EXISTS public.routine_exercises CASCADE;
DROP TABLE IF EXISTS public.workout_routines CASCADE;
DROP TABLE IF EXISTS public.exercises CASCADE;
DROP TABLE IF EXISTS public.app_users CASCADE;

-- ============================================================
-- 2. KULLANICILAR (Davetiye PIN: 4004 ile kayıt olunur)
-- ============================================================
CREATE TABLE public.app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  height_cm NUMERIC(4,1) DEFAULT 180.0,
  target_weight_kg NUMERIC(4,1) DEFAULT 85.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. EGZERSİZ KÜTÜPHANESİ (Görsel ve Form Rehberleri ile)
-- ============================================================
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  target_muscle TEXT NOT NULL, -- 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'
  secondary_muscles TEXT[] DEFAULT '{}',
  equipment TEXT DEFAULT 'Dumbbell', -- 'Dumbbell', 'Bodyweight', 'Ab-Wheel', 'Pull-up Bar'
  default_rest_seconds INT DEFAULT 90,
  instructions TEXT,
  form_cues TEXT[] DEFAULT '{}',
  common_mistakes TEXT[] DEFAULT '{}',
  image_url TEXT,
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. DİNAMİK RUTİNLER (Kullanıcıya Özel)
-- ============================================================
CREATE TABLE public.workout_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- 'İtiş A', 'Çekiş A', 'Bacak & Core'
  sequence_order INT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- ============================================================
-- 5. ANTRENMAN SEANSLARI VE SET LOGLARI (Kullanıcıya Özel)
-- ============================================================
CREATE TABLE public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE,
  routine_id UUID REFERENCES public.workout_routines(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  rpe_score INT CHECK (rpe_score BETWEEN 1 AND 10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- ============================================================
-- 6. VÜCUT METRİKLERİ VE ÖLÇÜMLER (Kullanıcıya Özel)
-- ============================================================
CREATE TABLE public.body_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE,
  recorded_at DATE DEFAULT CURRENT_DATE NOT NULL,
  weight_kg NUMERIC(4,1) NOT NULL,
  waist_cm NUMERIC(4,1),
  arm_cm NUMERIC(4,1),
  chest_cm NUMERIC(4,1),
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. GELİŞİM FOTOĞRAFLARI (Soğuk vs. Pump Karşılaştırmalı)
-- ============================================================
CREATE TABLE public.progress_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  timing TEXT NOT NULL DEFAULT 'pre_workout', -- 'pre_workout' (Soğuk) vs 'post_workout' (Pump)
  pose TEXT NOT NULL DEFAULT 'front', -- 'front', 'side', 'back', 'other'
  weight_kg NUMERIC(4,1),
  recorded_at DATE DEFAULT CURRENT_DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. AI ANTRENÖR LOGLARI VE HAFIZA DOSYASI (Kullanıcıya Özel)
-- ============================================================
CREATE TABLE public.ai_coach_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  evaluation_summary TEXT NOT NULL,
  suggested_changes JSONB,
  applied BOOLEAN DEFAULT FALSE
);

-- ============================================================
-- 9. İNDEKSLER VE RLS
-- ============================================================
CREATE INDEX idx_app_users_username ON public.app_users(username);
CREATE INDEX idx_workout_routines_user_id ON public.workout_routines(user_id);
CREATE INDEX idx_routine_exercises_routine_id ON public.routine_exercises(routine_id);
CREATE INDEX idx_workout_sessions_user_id ON public.workout_sessions(user_id);
CREATE INDEX idx_set_logs_session_id ON public.set_logs(session_id);
CREATE INDEX idx_body_metrics_user_id ON public.body_metrics(user_id);
CREATE INDEX idx_progress_photos_user_id ON public.progress_photos(user_id);
CREATE INDEX idx_ai_coach_logs_user_id ON public.ai_coach_logs(user_id);

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.set_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_coach_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access on app_users" ON public.app_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access on exercises" ON public.exercises FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access on workout_routines" ON public.workout_routines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access on routine_exercises" ON public.routine_exercises FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access on workout_sessions" ON public.workout_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access on set_logs" ON public.set_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access on body_metrics" ON public.body_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access on progress_photos" ON public.progress_photos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access on ai_coach_logs" ON public.ai_coach_logs FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 10. GÖRSEL VE VİDEO/FORM REHBERLİ BAŞLANGIÇ EGZERSİZLERİ
-- ============================================================
INSERT INTO public.exercises (id, name, target_muscle, secondary_muscles, equipment, default_rest_seconds, instructions, form_cues, common_mistakes, image_url, video_url) VALUES
('10000000-0000-0000-0000-000000000001', 'Dumbbell Floor Press / Bench Press', 'Chest', ARRAY['Triceps', 'Front Delt'], 'Dumbbell', 90, 
 'Yere sırtüstü veya düz sehpaya uzanın. Dambılları göğüs hizasından yukarı kontrollü basın, tepe noktada göğüs kaslarınızı sıkın.',
 ARRAY['Dirseklerinizi gövdeye 45-60 derece açıyla tutun', 'Üst noktada dambılları birbirine çarpmayın', 'Yere inerken dirsekleri yere hafifçe dokundurup 1 saniye duraklayın'],
 ARRAY['Dirsekleri 90 derece yana açmak (omuz zorlanması)', 'Beli aşırı kavis yapmak'],
 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&auto=format&fit=crop&q=80',
 'https://www.youtube.com/watch?v=uUGDRwge4F8'),

('10000000-0000-0000-0000-000000000002', 'Incline Dumbbell Press (Açılı Sehpa/Minder)', 'Chest', ARRAY['Front Delt', 'Triceps'], 'Dumbbell', 90,
 'Üst göğüs liflerini hedeflemek için 30-45 derecelik açıyla uzanın. Dambılları yukarı presleyin.',
 ARRAY['Kürek kemiklerini sehpaya kilitleyin', 'Göğüs kemiğini öne doğru çıkarın'],
 ARRAY['Açıyı 45 dereceden fazla dik yapmak (omuz baskısını artırır)'],
 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop&q=80',
 'https://www.youtube.com/watch?v=8iPEnn-ltC8'),

('10000000-0000-0000-0000-000000000003', 'Dumbbell Shoulder Press (Omuz Presi)', 'Shoulders', ARRAY['Triceps', 'Upper Chest'], 'Dumbbell', 90,
 'Dambılları omuz hizasından başınızın üzerine doğru presleyin. Merkez bölgenizi sıkarak bel kavisini önleyin.',
 ARRAY['Karın ve kalça kaslarınızı sıkın', 'Dambılları başınızın üzerinde tam kilitlemeyin'],
 ARRAY['Ağır kiloda geriye yaslanarak göğüs presine dönüştürmek'],
 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
 'https://www.youtube.com/watch?v=qEwKCR5JCog'),

('10000000-0000-0000-0000-000000000004', 'Dumbbell Lateral Raise (Yan Omuz)', 'Shoulders', ARRAY['Traps'], 'Dumbbell', 60,
 'Yan omuz izolasyonu için dirsekleri hafif kırık tutarak dambılları yana omuz hizasına kaldırın.',
 ARRAY['Dambılı değil dirseği yukarı kaldırmaya odaklanın', 'Tepe noktada yarım saniye bekleyin'],
 ARRAY['Gövdeyi sallayarak momentumdan güç almak', 'Ağırlığı çok ağır seçmek'],
 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=80',
 'https://www.youtube.com/watch?v=3VcKaXpzqRo'),

('10000000-0000-0000-0000-000000000005', 'Dumbbell Overhead Triceps Extension', 'Arms', ARRAY['Core'], 'Dumbbell', 60,
 'Tek veya iki elle dambılı baş arkasına indirin ve dirsekleri sabit tutarak yukarı itin.',
 ARRAY['Dirseklerin dışa aşırı açılmasını engelleyin', 'Tam hareket aralığı ile esnetin'],
 ARRAY['Dirsekleri öne arkaya sallamak'],
 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&auto=format&fit=crop&q=80',
 'https://www.youtube.com/watch?v=-Vyt2QdsR7E'),

('10000000-0000-0000-0000-000000000006', 'Şınav (Push-Up)', 'Chest', ARRAY['Triceps', 'Core', 'Front Delt'], 'Bodyweight', 60,
 'Vücudunuz ayaklardan başa kadar düz bir çizgi halinde olmalıdır. Göğsünüzü yere yaklaştırıp patlayıcı itin.',
 ARRAY['Karın ve glute kaslarını sıkın', 'Dirsekleri gövdeye 45 derece açıyla tutun'],
 ARRAY['Kalçanın aşağı çökmesi veya havada kalması'],
 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=800&auto=format&fit=crop&q=80',
 'https://www.youtube.com/watch?v=IODxDxX7oi4'),

('10000000-0000-0000-0000-000000000007', 'Pull-Up (Barfiks - Geniş/Normal Tutuş)', 'Back', ARRAY['Biceps', 'Forearms', 'Core'], 'Pull-up Bar', 120,
 'Geniş kanat gelişimi için dikey çekiş. Göğsünüzü bara yaklaştırın ve kürek kemiklerinizi aşağı ve birbirine sıkıştırın.',
 ARRAY['Harekete kürek kemiklerini sıkarak başlayın', 'Çenenizi barın üzerine çıkarın', 'İnişi 2-3 saniyede kontrollü yapın'],
 ARRAY['Ayakları sallayarak zıplamak (kipping)', 'Yarım tekrar yapmak'],
 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&auto=format&fit=crop&q=80',
 'https://www.youtube.com/watch?v=eGo4IYlbE5g'),

('10000000-0000-0000-0000-000000000008', 'Chin-Up (Barfiks - Avuç İçi Bize Dönük)', 'Back', ARRAY['Biceps', 'Lats'], 'Pull-up Bar', 90,
 'Biceps ve alt kanat kaslarını yoğun çalıştıran dikey çekiş. Tam açılıp tam çekin.',
 ARRAY['Dirsekleri geriye ve aşağı doğru çekin', 'Tepe noktada göğsü bara değdirmeye çalışın'],
 ARRAY['Aşağıda dirsekleri aniden kitleyerek ekleme yük bindirmek'],
 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=800&auto=format&fit=crop&q=80',
 'https://www.youtube.com/watch?v=brhRXlOhsAM'),

('10000000-0000-0000-0000-000000000009', 'Tek Kol Dumbbell Row (Testere Çekiş)', 'Back', ARRAY['Biceps', 'Rear Delt'], 'Dumbbell', 75,
 'Dizi bir sehpaya veya koltuğa dayayın. Dambılı cebinize doğru çekerek kanat kasınızı tam sıkıştırın.',
 ARRAY['Dambılı düz yukarı değil yay çizerek kalçaya doğru çekin', 'Sırtınızı yere paralel tutun'],
 ARRAY['Gövdeyi aşırı döndürerek çekmek', 'Ağırlığı omuzla çekmek'],
 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=800&auto=format&fit=crop&q=80',
 'https://www.youtube.com/watch?v=pYcpY20QaE8'),

('10000000-0000-0000-0000-000000000010', 'Çift Kol Dumbbell Bent-Over Row', 'Back', ARRAY['Biceps', 'Spinal Erectors'], 'Dumbbell', 90,
 'Kalçayı geriye iterek 45 derece öne eğilin. Sırtı düz tutarak dambılları karna doğru çekin.',
 ARRAY['Omurgayı nötr tutun', 'Dirsekleri geriye doğru sürün'],
 ARRAY['Sırtı kamburlaştırmak (bel sakatlanma riski)'],
 'https://images.unsplash.com/photo-1581009137042-c552e485697a?w=800&auto=format&fit=crop&q=80',
 'https://www.youtube.com/watch?v=6TSP13hG6KE'),

('10000000-0000-0000-0000-000000000011', 'Dumbbell Biceps Curl', 'Arms', ARRAY['Forearms'], 'Dumbbell', 60,
 'Dirsekleri gövdeye sabitleyin. Dambılları kaldırırken tepe noktada serçe parmağınızı hafifçe dışa döndürün.',
 ARRAY['Dirsekleri öne arkaya oynatmayın', 'Negatif inişi 2 saniyede yavaş yapın'],
 ARRAY['Beli geriye atarak sallanmak'],
 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=80',
 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo'),

('10000000-0000-0000-0000-000000000012', 'Dumbbell Hammer Curl (Çekiç Biceps)', 'Arms', ARRAY['Brachialis', 'Forearms'], 'Dumbbell', 60,
 'Avuç içleri birbirine bakacak şekilde (nötr tutuş) curl yapın. Kolun kalınlığını artıran brachialis kasını hedefler.',
 ARRAY['Bilekleri bükmeyin düz tutun', 'Tepe noktada 1 saniye sıkın'],
 ARRAY['Hızlı ve kontrolsüz indirmek'],
 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&auto=format&fit=crop&q=80',
 'https://www.youtube.com/watch?v=zC3nLlEvin4'),

('10000000-0000-0000-0000-000000000013', 'Rear Delt Fly (Eğilerek Arka Omuz)', 'Shoulders', ARRAY['Upper Back'], 'Dumbbell', 60,
 'Öne eğilerek dambılları yana açın. 3D omuz görüntüsü ve duruş için arka omuz kaslarını çalıştırır.',
 ARRAY['Hafif ağırlık seçin', 'Kolları hafif bükülü tutarak kanat çırpar gibi açın'],
 ARRAY['Ağır kiloda sırtla çekmek'],
 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop&q=80',
 'https://www.youtube.com/watch?v=EA7uKGdd_30'),

('10000000-0000-0000-0000-000000000014', 'Goblet Squat (Dambıl ile Derin Squat)', 'Legs', ARRAY['Glutes', 'Core', 'Quads'], 'Dumbbell', 90,
 'Dambılı göğüs önünde dikey tutarak derin squat yapın. Gövdeyi dik tutun ve dizleri ayak parmakları yönünde açın.',
 ARRAY['Topukları yerden kaldırmayın', 'Derinlikte kalçayı diz hizasının altına indirin'],
 ARRAY['Dizlerin içe doğru çökmesi'],
 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&auto=format&fit=crop&q=80',
 'https://www.youtube.com/watch?v=MeIiIdhvXT4'),

('10000000-0000-0000-0000-000000000015', 'Bulgarian Split Squat', 'Legs', ARRAY['Glutes', 'Quads'], 'Dumbbell', 90,
 'Bir ayağınızı arkadaki sandalye/sehpaya koyun. Ön bacak üzerinde çömelin. Tek bacak hipertrofisi için en etkili harekettir.',
 ARRAY['Ağırlığın %85-ini ön ayakta tutun', 'Ön dizin 90 derece bükülmesini sağlayın'],
 ARRAY['Arkaya aşırı yaslanmak'],
 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=800&auto=format&fit=crop&q=80',
 'https://www.youtube.com/watch?v=2C-uNgKwPLE'),

('10000000-0000-0000-0000-000000000016', 'Romanian Deadlift (Dumbbell RDL)', 'Legs', ARRAY['Hamstrings', 'Glutes', 'Lower Back'], 'Dumbbell', 90,
 'Dizleri hafif kırıp kalçayı geriye doğru itin. Dambılları bacaklara yakın tutarak arka bacak kaslarını esnetin.',
 ARRAY['Sırtı dümdüz tutun', 'Hareketi kalçayı geriye iterek başlatın'],
 ARRAY['Dizleri çok büküp squata çevirmek', 'Beli kamburlaştırmak'],
 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
 'https://www.youtube.com/watch?v=5rTZZj_Q3_U'),

('10000000-0000-0000-0000-000000000017', 'Dumbbell Calf Raise (Kalf Yükselişi)', 'Legs', ARRAY['Calves'], 'Dumbbell', 60,
 'Dambıllar elinizde parmak ucuna maksimum yükselin, tepe noktada 2 saniye sıkıp yavaşça inin.',
 ARRAY['Tepe noktada duraklayın', 'Tam hareket aralığı uygulayın'],
 ARRAY['Zıplayarak hızlıca yapmak'],
 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&auto=format&fit=crop&q=80',
 'https://www.youtube.com/watch?v=-M4-G8p8fmc'),

('10000000-0000-0000-0000-000000000018', 'Ab-Wheel Rollout (Karın Tekeri)', 'Core', ARRAY['Lats', 'Shoulders'], 'Ab-Wheel', 75,
 'Dizlerinizin üzerinde tekeri kontrollü ileri itin. Belinizi çökertmeden karın gücüyle geri çekin. En güçlü core hareketidir.',
 ARRAY['Belinizi asla aşağı çökertmeyin', 'Kalçanızı değil karın kaslarınızı sıkarak geri dönün'],
 ARRAY['Kolları çekerek kalçayı geriye fırlatmak'],
 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
 'https://www.youtube.com/watch?v=rqiTPdK1c_I'),

('10000000-0000-0000-0000-000000000019', 'Hanging Knee / Leg Raise (Barfikste Karın)', 'Core', ARRAY['Hip Flexors', 'Grip'], 'Pull-up Bar', 60,
 'Barfiks barında asılı kalın, bacaklarınızı veya dizlerinizi göğsünüze doğru çekin. Salınımı engelleyin.',
 ARRAY['Gövdenin ileri geri sallanmasını durdurun', 'Pelvisi yukarı doğru yuvarlayın'],
 ARRAY['Momentumla bacakları fırlatmak'],
 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&auto=format&fit=crop&q=80',
 'https://www.youtube.com/watch?v=RD_A-Z15Er4'),

('10000000-0000-0000-0000-000000000020', 'Plank / Side Plank', 'Core', ARRAY['Shoulders', 'Glutes'], 'Bodyweight', 45,
 'Dirsekler üzerinde tüm vücudu düz ve gergin bir tahta gibi sabit tutun.',
 ARRAY['Karın, kalça ve bacakları aynı anda sıkın', 'Düz nefes alıp verin'],
 ARRAY['Belin aşağı düşmesi'],
 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=800&auto=format&fit=crop&q=80',
 'https://www.youtube.com/watch?v=pSHjTRCQxIw');

-- ============================================================
-- 11. İLK HESAP (Kemal - Varsayılan Kullanıcı)
-- ============================================================
INSERT INTO public.app_users (id, username, password_hash, display_name, height_cm, target_weight_kg)
VALUES ('00000000-0000-0000-0000-000000000001', 'kemal', '1234', 'Kemal', 180.0, 85.0)
ON CONFLICT (username) DO NOTHING;

-- İlk Kullanıcı Rutinleri
INSERT INTO public.workout_routines (id, user_id, name, sequence_order, description, is_active) VALUES
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'İtiş A (Göğüs - Omuz - Triceps)', 1, 'Ağır dambıl göğüs presi ve omuz kuvveti', true),
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Çekiş A (Sırt - Biceps - Arka Omuz)', 2, 'Barfiks dikey çekiş ve tek kol ağır dambıl row', true),
('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Bacak & Core (Kuvvet & Karın)', 3, 'Goblet squat, RDL ve Ab-Wheel rollout', true),
('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'İtiş B (Hipertrofi & Hacim)', 4, 'Incline press, lateral raise ve şınav', true),
('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Çekiş B (Kanat & Kol Yoğunluğu)', 5, 'Chin-up, çift kol row ve hammer curl', true)
ON CONFLICT (id) DO NOTHING;

-- Rutin Egzersiz Eşleştirmeleri
INSERT INTO public.routine_exercises (routine_id, exercise_id, order_in_routine, target_sets, target_reps, target_weight_kg, notes) VALUES
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 1, 4, '8-10', 20.0, 'Son sette tükenişe 1 tekrar kala bırakın.'),
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 2, 3, '8-12', 15.0, 'Omuz hizasından tam kontrol.'),
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 3, 4, '12-15', 7.5, 'Dirsekler hafif bükülü.'),
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 4, 3, '10-12', 17.5, 'Tek dambıl ile uzatış.'),
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000006', 5, 2, '15-20', 0.0, 'Bitirici set olarak şınav.'),

('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000007', 1, 4, '5-8', 0.0, 'Geniş tutuş barfiks.'),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000009', 2, 4, '8-10', 22.5, 'Ağır dambıl ile kanatları çekin.'),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000013', 3, 3, '12-15', 7.5, 'Arka omuz kontrolü.'),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000011', 4, 3, '10-12', 12.5, 'Dumbbell curl.'),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000012', 5, 3, '10-12', 12.5, 'Hammer curl.'),

('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000014', 1, 4, '10-12', 24.5, 'En ağır dambıl ile goblet squat.'),
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000016', 2, 4, '10-12', 20.0, 'RDL ile arka bacak yüklemesi.'),
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000015', 3, 3, '8-10', 12.5, 'Bulgarian split squat.'),
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000018', 4, 4, '10-15', 0.0, 'Ab-wheel karın çalışması.'),
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000019', 5, 3, '12-15', 0.0, 'Hanging knee raise.')
ON CONFLICT (id) DO NOTHING;

-- İlk Kullanıcı Ölçümleri
INSERT INTO public.body_metrics (user_id, recorded_at, weight_kg, waist_cm, arm_cm, chest_cm, notes) VALUES
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '14 days', 100.8, 102.0, 39.5, 112.0, 'Başlangıç ölçümü'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '10 days', 100.4, 101.5, 39.5, 112.0, 'Sabah aç karnına'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '7 days', 100.1, 101.0, 39.7, 112.5, '1. Hafta değerlendirme'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '3 days', 99.8, 100.5, 40.0, 112.5, 'Recomposition başlıyor'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE, 99.6, 100.0, 40.0, 113.0, 'Son tartım')
ON CONFLICT (id) DO NOTHING;

-- 8. AI Chat Sessions (Kalıcı Sohbet Geçmişi & Oturumlar)
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated ON public.chat_sessions(updated_at DESC);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read chat_sessions" ON public.chat_sessions FOR SELECT USING (true);
CREATE POLICY "Allow public insert chat_sessions" ON public.chat_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update chat_sessions" ON public.chat_sessions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete chat_sessions" ON public.chat_sessions FOR DELETE USING (true);

-- 9. Kullanıcı Profili ve Onboarding Kolonları
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS current_weight_kg NUMERIC(5,2);
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS fitness_goal TEXT;
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS experience_level TEXT;
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS workout_days_per_week INTEGER DEFAULT 4;
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS equipment TEXT[] DEFAULT ARRAY['Dumbbell', 'Bodyweight', 'Ab-Wheel', 'Pull-up Bar'];
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;


