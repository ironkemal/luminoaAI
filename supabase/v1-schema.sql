-- ============================================================
-- Lumino AI — v1: Temel Şema
-- Supabase Dashboard > SQL Editor > New Query > Yapıştır > Run
-- Bu dosya güvenlidir: CREATE TABLE IF NOT EXISTS kullanır,
-- zaten varsa hata vermez.
-- ============================================================

-- ── 1. PROFILES ──────────────────────────────────────────────
-- auth.users tablosunu genişletir (isim, meslek durumu, sektör)

CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name   TEXT,
  job_status  TEXT CHECK (job_status IN ('employed', 'job_seeking')),
  sector      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_select_own'
  ) THEN
    CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_update_own'
  ) THEN
    CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_insert_own'
  ) THEN
    CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Yeni kullanıcı kaydolduğunda otomatik profil oluştur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 2. CV DATA ────────────────────────────────────────────────
-- Kullanıcının yüklediği CV'nin metin içeriği (RAG için)

CREATE TABLE IF NOT EXISTS public.cv_data (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  file_name      TEXT NOT NULL,
  extracted_text TEXT NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.cv_data ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cv_data' AND policyname = 'cv_data_own'
  ) THEN
    CREATE POLICY "cv_data_own" ON public.cv_data FOR ALL
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cv_data_user_id ON public.cv_data(user_id);

-- ── 3. SESSIONS ───────────────────────────────────────────────
-- Her görüşme oturumu (senaryo, şirket, zorluk seviyesi)

CREATE TABLE IF NOT EXISTS public.sessions (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  scenario_type    TEXT CHECK (scenario_type IN ('job_interview', 'salary_negotiation', 'performance_review')) NOT NULL,
  company_name     TEXT,
  job_title        TEXT,
  sector           TEXT,
  difficulty       TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) NOT NULL DEFAULT 'medium',
  status           TEXT CHECK (status IN ('active', 'completed')) NOT NULL DEFAULT 'active',
  company_research TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at     TIMESTAMPTZ
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sessions' AND policyname = 'sessions_own'
  ) THEN
    CREATE POLICY "sessions_own" ON public.sessions FOR ALL
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status  ON public.sessions(status);

-- ── 4. MESSAGES ───────────────────────────────────────────────
-- Görüşme içindeki mesajlar (user / assistant)

CREATE TABLE IF NOT EXISTS public.messages (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  role       TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'messages_own'
  ) THEN
    CREATE POLICY "messages_own" ON public.messages FOR ALL
    USING (
      auth.uid() = (SELECT user_id FROM public.sessions WHERE id = session_id)
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_messages_session_id ON public.messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- ── 5. SESSION ANALYSIS ───────────────────────────────────────
-- Görüşme sonrası AI analizi (güçlü/zayıf yönler, puan)

CREATE TABLE IF NOT EXISTS public.session_analysis (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id    UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL UNIQUE,
  strengths     TEXT[] NOT NULL DEFAULT '{}',
  weaknesses    TEXT[] NOT NULL DEFAULT '{}',
  best_moment   TEXT NOT NULL DEFAULT '',
  overall_score INTEGER CHECK (overall_score BETWEEN 0 AND 100) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.session_analysis ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'session_analysis' AND policyname = 'session_analysis_own'
  ) THEN
    CREATE POLICY "session_analysis_own" ON public.session_analysis FOR ALL
    USING (
      auth.uid() = (SELECT user_id FROM public.sessions WHERE id = session_id)
    );
  END IF;
END $$;

-- ── 6. TODOS ──────────────────────────────────────────────────
-- AI'ın önerdiği pratik yapılacaklar listesi

CREATE TABLE IF NOT EXISTS public.todos (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  content    TEXT NOT NULL,
  completed  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'todos' AND policyname = 'todos_own'
  ) THEN
    CREATE POLICY "todos_own" ON public.todos FOR ALL
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_todos_user_id   ON public.todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON public.todos(completed);

-- ============================================================
-- Kontrol: hangi tablolar oluşturuldu?
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('profiles','cv_data','sessions','messages','session_analysis','todos')
ORDER BY table_name;
-- Çıktıda 6 satır görmelisin.
-- ============================================================
