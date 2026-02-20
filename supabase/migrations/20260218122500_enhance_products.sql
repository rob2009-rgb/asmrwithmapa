-- ENHANCE: Products table with descriptions and hero status
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS is_hero BOOLEAN DEFAULT false;

-- Add a comment for clarity
COMMENT ON COLUMN public.products.description IS 'Detailed product description with HTML support';
COMMENT ON COLUMN public.products.is_hero IS 'Whether this product is featured as the Sanctuary Hero';

-- Reset any previous hero assignments to ensures only one can be hero (logic handled by app, but defaulting to false here)
-- We can add a constraint later if needed, but for now we'll manage via Admin UI.

-- Standardize RLS for products (Admin Full, Public Read)
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products" 
ON public.products FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products" 
ON public.products FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);
