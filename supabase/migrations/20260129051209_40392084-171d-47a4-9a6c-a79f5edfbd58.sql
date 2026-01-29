-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL CHECK (price >= 0),
  image_url TEXT,
  stock_count INTEGER NOT NULL DEFAULT 0 CHECK (stock_count >= 0),
  category TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  total NUMERIC NOT NULL CHECK (total >= 0),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order_items table (junction for orders and products)
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_at_purchase NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Products policies (anyone can view, admins can manage)
CREATE POLICY "Anyone can view products"
ON public.products FOR SELECT
USING (true);

CREATE POLICY "Admins can manage products"
ON public.products FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Orders policies
CREATE POLICY "Users can view their own orders"
ON public.orders FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own orders"
ON public.orders FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all orders"
ON public.orders FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update orders"
ON public.orders FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Order items policies
CREATE POLICY "Users can view their own order items"
ON public.order_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.orders
  WHERE orders.id = order_items.order_id
  AND orders.user_id = auth.uid()
));

CREATE POLICY "Users can create order items for their orders"
ON public.order_items FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.orders
  WHERE orders.id = order_items.order_id
  AND orders.user_id = auth.uid()
));

CREATE POLICY "Admins can view all order items"
ON public.order_items FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Add triggers for updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert mock products
INSERT INTO public.products (name, description, price, image_url, stock_count, category) VALUES
('Power Gym T-Shirt', 'Premium cotton workout tee with our logo', 29.99, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', 50, 'apparel'),
('Performance Tank Top', 'Breathable mesh tank for intense workouts', 24.99, 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=400', 35, 'apparel'),
('Gym Hoodie', 'Cozy pullover hoodie for post-workout', 49.99, 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400', 25, 'apparel'),
('Protein Powder - Chocolate', 'Premium whey protein isolate 2lb', 44.99, 'https://images.unsplash.com/photo-1593095948071-474c414e5a5a?w=400', 100, 'supplements'),
('Pre-Workout Energy', 'High-intensity pre-workout formula', 34.99, 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=400', 75, 'supplements'),
('BCAA Recovery', 'Branch chain amino acids for recovery', 29.99, 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=400', 60, 'supplements'),
('Gym Bag', 'Durable sports duffel bag', 39.99, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', 40, 'accessories'),
('Shaker Bottle', 'BPA-free protein shaker with mixer ball', 14.99, 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=400', 150, 'accessories'),
('Resistance Bands Set', '5-piece resistance band kit', 19.99, 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=400', 80, 'equipment'),
('Workout Gloves', 'Padded weightlifting gloves', 24.99, 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400', 45, 'accessories');