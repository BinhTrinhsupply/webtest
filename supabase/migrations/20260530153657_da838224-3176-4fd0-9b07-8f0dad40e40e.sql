
-- ===========================================
-- ENUMS
-- ===========================================
CREATE TYPE public.app_role AS ENUM ('admin', 'student');
CREATE TYPE public.lesson_content_type AS ENUM ('video', 'text', 'file');
CREATE TYPE public.order_status AS ENUM ('pending', 'completed', 'cancelled');
CREATE TYPE public.payment_method AS ENUM ('sepay', 'manual', 'free');

-- ===========================================
-- TIMESTAMP HELPER
-- ===========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ===========================================
-- PROFILES
-- ===========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- USER ROLES
-- ===========================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer: avoids RLS recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, anon;

-- ===========================================
-- COURSES
-- ===========================================
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  short_description TEXT,
  long_description TEXT,
  thumbnail_url TEXT,
  category TEXT,
  price NUMERIC(12,0) NOT NULL DEFAULT 0,
  sale_price NUMERIC(12,0),
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.courses TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- CHAPTERS
-- ===========================================
CREATE TABLE public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chapters_course ON public.chapters(course_id, order_index);

GRANT SELECT ON public.chapters TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.chapters TO authenticated;
GRANT ALL ON public.chapters TO service_role;

ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_chapters_updated_at
  BEFORE UPDATE ON public.chapters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- LESSONS
-- ===========================================
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type public.lesson_content_type NOT NULL DEFAULT 'video',
  video_url TEXT,
  text_content TEXT,
  attachment_url TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  order_index INTEGER NOT NULL DEFAULT 0,
  is_preview BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lessons_chapter ON public.lessons(chapter_id, order_index);

GRANT SELECT ON public.lessons TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.lessons TO authenticated;
GRANT ALL ON public.lessons TO service_role;

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- BUMP PRODUCTS (Upsell digital items)
-- ===========================================
CREATE TABLE public.bump_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  price NUMERIC(12,0) NOT NULL DEFAULT 0,
  sale_price NUMERIC(12,0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.bump_products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.bump_products TO authenticated;
GRANT ALL ON public.bump_products TO service_role;

ALTER TABLE public.bump_products ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_bump_products_updated_at
  BEFORE UPDATE ON public.bump_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- ORDERS
-- ===========================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  bump_product_id UUID REFERENCES public.bump_products(id) ON DELETE SET NULL,
  total_amount NUMERIC(12,0) NOT NULL DEFAULT 0,
  payment_method public.payment_method NOT NULL DEFAULT 'sepay',
  status public.order_status NOT NULL DEFAULT 'pending',
  sepay_ref TEXT UNIQUE,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  note TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);

GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- ORDER ITEMS
-- ===========================================
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_type TEXT NOT NULL,
  product_id UUID NOT NULL,
  title TEXT NOT NULL,
  amount NUMERIC(12,0) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_items_order ON public.order_items(order_id);

GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- PROGRESS
-- ===========================================
CREATE TABLE public.progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

CREATE INDEX idx_progress_user ON public.progress(user_id);

GRANT SELECT, INSERT, DELETE ON public.progress TO authenticated;
GRANT ALL ON public.progress TO service_role;

ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- SITE SETTINGS (singleton row id=1)
-- ===========================================
CREATE TABLE public.site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  facebook_pixel_id TEXT,
  google_analytics_id TEXT,
  sepay_bank TEXT,
  sepay_account_number TEXT,
  sepay_account_name TEXT,
  sepay_webhook_secret TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_singleton CHECK (id = 1)
);

GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.site_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- ===========================================
-- ACCESS HELPER
-- ===========================================
CREATE OR REPLACE FUNCTION public.user_has_course_access(_user_id UUID, _course_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders
    WHERE user_id = _user_id
      AND course_id = _course_id
      AND status = 'completed'
  ) OR public.has_role(_user_id, 'admin');
$$;

GRANT EXECUTE ON FUNCTION public.user_has_course_access(UUID, UUID) TO authenticated;

-- ===========================================
-- RLS POLICIES
-- ===========================================

-- PROFILES
CREATE POLICY "Profiles: user can view own" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Profiles: admin can view all" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Profiles: user can update own" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Profiles: admin can update all" ON public.profiles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Profiles: user can insert own" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- USER ROLES
CREATE POLICY "Roles: user can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Roles: admin can view all" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- COURSES — public read for published, admin full
CREATE POLICY "Courses: public view published" ON public.courses
  FOR SELECT TO anon, authenticated USING (is_published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Courses: admin insert" ON public.courses
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Courses: admin update" ON public.courses
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Courses: admin delete" ON public.courses
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- CHAPTERS — public read, admin full
CREATE POLICY "Chapters: public view" ON public.chapters
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Chapters: admin insert" ON public.chapters
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Chapters: admin update" ON public.chapters
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Chapters: admin delete" ON public.chapters
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- LESSONS — only enrolled users or admin
CREATE POLICY "Lessons: enrolled or preview can view" ON public.lessons
  FOR SELECT TO authenticated USING (
    is_preview = true
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.chapters c
      WHERE c.id = lessons.chapter_id
        AND public.user_has_course_access(auth.uid(), c.course_id)
    )
  );
CREATE POLICY "Lessons: admin insert" ON public.lessons
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Lessons: admin update" ON public.lessons
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Lessons: admin delete" ON public.lessons
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- BUMP PRODUCTS
CREATE POLICY "Bump: public view active" ON public.bump_products
  FOR SELECT TO anon, authenticated USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Bump: admin insert" ON public.bump_products
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Bump: admin update" ON public.bump_products
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Bump: admin delete" ON public.bump_products
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ORDERS
CREATE POLICY "Orders: user view own" ON public.orders
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Orders: admin view all" ON public.orders
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Orders: user insert own pending" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Orders: admin update" ON public.orders
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ORDER ITEMS
CREATE POLICY "OrderItems: view via order" ON public.order_items
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (o.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );
CREATE POLICY "OrderItems: insert via own order" ON public.order_items
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.user_id = auth.uid()
    )
  );

-- PROGRESS
CREATE POLICY "Progress: user view own" ON public.progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Progress: admin view all" ON public.progress
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Progress: user insert own" ON public.progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Progress: user delete own" ON public.progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- SITE SETTINGS
CREATE POLICY "Settings: public view" ON public.site_settings
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Settings: admin update" ON public.site_settings
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Settings: admin insert" ON public.site_settings
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===========================================
-- AUTH TRIGGER: profile + role on signup
-- ===========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  -- Default role: student
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Auto-grant admin to the bootstrap email
  IF lower(NEW.email) = 'trinhdinhbinh2k@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
