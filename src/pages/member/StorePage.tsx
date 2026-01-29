import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MemberLayout } from '@/components/layout/MemberLayout';
import { ProductCard } from '@/components/store/ProductCard';
import { CartButton } from '@/components/store/CartButton';
import { ShoppingCartSidebar } from '@/components/store/ShoppingCartSidebar';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingBag } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock_count: number;
  category: string | null;
}

const CATEGORIES = ['all', 'apparel', 'supplements', 'accessories', 'equipment'];

export default function StorePage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching products:', error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory);

  const getCategoryLabel = (category: string) => {
    return t(`store.categories.${category}`);
  };

  return (
    <MemberLayout>
      <ShoppingCartSidebar />
      
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <ShoppingBag className="h-7 w-7 text-primary" />
              {t('store.title')}
            </h1>
            <p className="text-muted-foreground mt-1">{t('store.subtitle')}</p>
          </div>
          <CartButton />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              className="capitalize"
              onClick={() => setSelectedCategory(category)}
            >
              {getCategoryLabel(category)}
            </Button>
          ))}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium">{t('store.noProducts')}</p>
            <p className="text-muted-foreground">{t('store.tryDifferentCategory')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </MemberLayout>
  );
}
