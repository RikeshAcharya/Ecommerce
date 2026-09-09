// src/components/AddToCartButton.tsx
import React, { useState } from 'react';
import { cartService } from '../api/services/cartService';
import { useCart } from '../context/CartContext';

interface AddToCartButtonProps {
  productId: number;
  className?: string;
  children?: React.ReactNode;
}

export const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  productId,
  className = '',
  children = 'Add to Cart',
}) => {
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { cart, refreshCart } = useCart();

  const item = cart?.items?.find(
    (i) => i.product?.id === productId
  );

  const quantity = item?.quantity ?? 0;
  const cartItemId = item?.id;

  const run = async (action: () => Promise<any>) => {
    setIsBusy(true);
    setError(null);

    try {
      await action();
      await refreshCart();
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
      console.error('Cart error:', err);
    } finally {
      setIsBusy(false);
    }
  };

  const handleAdd = () =>
    run(() =>
      cartService.addToCart({
        product_id: productId,
        quantity: 1,
      })
    );

  const handleIncrement = () =>
    run(() =>
      cartService.updateCartItem(cartItemId!, {
        quantity: quantity + 1,
      })
    );

  const handleDecrement = () => {
    if (quantity <= 1) {
      run(() => cartService.removeFromCart(cartItemId!));
    } else {
      run(() =>
        cartService.updateCartItem(cartItemId!, {
          quantity: quantity - 1,
        })
      );
    }
  };

  // Not in cart
  if (quantity === 0) {
    return (
      <div className={`inline-flex flex-col items-start gap-1.5 ${className}`}>
        <button
          onClick={handleAdd}
          disabled={isBusy}
          className="
            group
            inline-flex
            h-11
            min-w-[150px]
            items-center
            justify-center
            gap-3
            rounded-xl
            border
            border-white/25
            bg-transparent
            px-5
            text-sm
            font-semibold
            tracking-wide
            text-inherit
            shadow-sm
            transition-all
            duration-200
            ease-out
            hover:-translate-y-0.5
            hover:border-white/60
            hover:shadow-lg
            active:translate-y-0
            active:scale-[0.97]
            disabled:cursor-not-allowed
            disabled:opacity-50
            disabled:hover:translate-y-0
          "
        >
          <span>
            {isBusy ? 'Adding...' : children}
          </span>

          {!isBusy && (
            <span
              className="
                flex
                h-6
                w-6
                items-center
                justify-center
                rounded-full
                border
                border-current
                text-sm
                transition-transform
                duration-200
                group-hover:translate-x-1
              "
            >
              →
            </span>
          )}
        </button>

        {error && (
          <p className="text-xs text-red-500">
            {error}
          </p>
        )}
      </div>
    );
  }

  // Already in cart
  return (
    <div className={`inline-flex flex-col items-start gap-1.5 ${className}`}>
      <div
        className="
          inline-flex
          h-11
          items-center
          overflow-hidden
          rounded-xl
          border
          border-white/25
          bg-transparent
          shadow-sm
          transition-all
          duration-200
          hover:border-white/60
          hover:shadow-lg
        "
      >
        <button
          onClick={handleDecrement}
          disabled={isBusy}
          aria-label="Decrease quantity"
          className="
            flex
            h-full
            w-11
            items-center
            justify-center
            bg-transparent
            text-xl
            font-light
            text-inherit
            transition-all
            duration-150
            hover:bg-white/10
            hover:scale-110
            active:scale-90
            disabled:cursor-not-allowed
            disabled:opacity-40
          "
        >
          −
        </button>

        <div
          className="
            flex
            h-full
            min-w-12
            items-center
            justify-center
            border-x
            border-white/15
            px-2
            text-base
            font-bold
            text-inherit
          "
        >
          {isBusy ? '...' : quantity}
        </div>

        <button
          onClick={handleIncrement}
          disabled={isBusy}
          aria-label="Increase quantity"
          className="
            flex
            h-full
            w-11
            items-center
            justify-center
            bg-transparent
            text-xl
            font-light
            text-inherit
            transition-all
            duration-150
            hover:bg-white/10
            hover:scale-110
            active:scale-90
            disabled:cursor-not-allowed
            disabled:opacity-40
          "
        >
          +
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};