import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

export function CartButton() {
  const { totalItems, setIsCartOpen } = useCart();

  return (
    <Button
      variant="outline"
      size="icon"
      className="relative"
      onClick={() => setIsCartOpen(true)}
    >
      <ShoppingCart className="h-5 w-5" />
      {totalItems > 0 && (
        <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
          {totalItems > 9 ? '9+' : totalItems}
        </span>
      )}
    </Button>
  );
}
