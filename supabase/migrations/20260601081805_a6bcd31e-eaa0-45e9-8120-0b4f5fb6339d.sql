-- Blog posts
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  category text,
  thumbnail_url text,
  excerpt text,
  content text,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Blog: public view published" ON public.blog_posts FOR SELECT TO anon, authenticated USING (is_published = true OR has_role(auth.uid(),'admin'));
CREATE POLICY "Blog: admin insert" ON public.blog_posts FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Blog: admin update" ON public.blog_posts FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Blog: admin delete" ON public.blog_posts FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE TRIGGER blog_posts_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Coupons
CREATE TYPE public.coupon_type AS ENUM ('percent','amount');
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type public.coupon_type NOT NULL DEFAULT 'percent',
  discount_value numeric NOT NULL DEFAULT 0,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coupons: admin all" ON public.coupons FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SePay webhook logs
CREATE TABLE public.sepay_webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref text,
  amount numeric NOT NULL DEFAULT 0,
  content text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending', -- pending | matched | approved | failed | ignored
  reason text,
  order_id uuid,
  matched_at timestamptz,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.sepay_webhook_logs TO authenticated;
GRANT ALL ON public.sepay_webhook_logs TO service_role;
ALTER TABLE public.sepay_webhook_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SepayLogs: admin all" ON public.sepay_webhook_logs FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
