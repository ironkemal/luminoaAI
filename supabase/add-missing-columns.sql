-- ============================================================
-- Lumino PT — eksik sütun ve tabloları ekler (veri SİLMEZ)
-- Supabase Dashboard > SQL Editor > New Query > Yapıştır > Run
-- Her satır IF NOT EXISTS kullanır; birden fazla çalıştırmak güvenlidir.
-- NOT: migration.sql'i komple çalıştırma, en başta DROP TABLE yapar.
-- ============================================================

-- 1. Profil / onboarding sütunları
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'male';
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS current_weight_kg NUMERIC(5,2);
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS fitness_goal TEXT;
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS experience_level TEXT;
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS workout_days_per_week INTEGER DEFAULT 4;
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS equipment TEXT[] DEFAULT ARRAY['Dumbbell', 'Bodyweight', 'Ab-Wheel', 'Pull-up Bar'];
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS max_dumbbell_weight_kg NUMERIC(5,2) DEFAULT 24.5;
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS injuries_or_limitations TEXT;
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS health_notes TEXT;
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- 2. Sohbet geçmişi (şu an sadece tarayıcıda tutuluyor)
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated ON public.chat_sessions(updated_at DESC);
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access on chat_sessions" ON public.chat_sessions;
CREATE POLICY "Public access on chat_sessions" ON public.chat_sessions FOR ALL USING (true) WITH CHECK (true);

-- 3. Gelişim fotoğrafları
CREATE TABLE IF NOT EXISTS public.progress_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.app_users(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  timing TEXT NOT NULL DEFAULT 'pre_workout',
  pose TEXT NOT NULL DEFAULT 'front',
  weight_kg NUMERIC(4,1),
  recorded_at DATE DEFAULT CURRENT_DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_progress_photos_user_id ON public.progress_photos(user_id);
ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access on progress_photos" ON public.progress_photos;
CREATE POLICY "Public access on progress_photos" ON public.progress_photos FOR ALL USING (true) WITH CHECK (true);

-- PostgREST'in yeni sütunları hemen görmesi için
NOTIFY pgrst, 'reload schema';
