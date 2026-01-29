import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock_count: number;
  category: string | null;
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, items } = useCart();
  
  const cartItem = items.find(item => item.id === product.id);
  const currentQuantityInCart = cartItem?.quantity || 0;
  const isOutOfStock = product.stock_count === 0;
  const maxReached = currentQuantityInCart >= product.stock_count;

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      stock_count: product.stock_count,
    });
  };

  return (
    <Card className="glass-card overflow-hidden group">
      <div className="relative aspect-square overflow-hidden bg-muted/30">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No Image
          </div>
        )}
        {product.category && (
          <Badge className="absolute top-2 left-2 capitalize" variant="secondary">
            {product.category}
          </Badge>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Badge variant="destructive">Out of Stock</Badge>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg truncate">{product.name}</h3>
        {product.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {product.description}
          </p>
        )}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xl font-bold text-primary">${product.price.toFixed(2)}</span>
          <span className="text-xs text-muted-foreground">
            {product.stock_count} in stock
          </span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full gap-2"
          onClick={handleAddToCart}
          disabled={isOutOfStock || maxReached}
        >
          <ShoppingCart className="h-4 w-4" />
          {maxReached ? 'Max in Cart' : 'Add to Cart'}
        </Button>
      </CardFooter>
    </Card>
  );
}
