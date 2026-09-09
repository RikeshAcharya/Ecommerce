import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartService } from '../api/services/cartService';
import { useCart } from '../context/CartContext';
import { ConfirmationModal } from '../components/ConfirmationModal';
import styles from './Cart.module.css';

interface CartItem {
  id: number;
  product: {
    id: number;
    name: string;
    price: string;
    primary_image: string;
  };
  quantity: number;
  total_price: string;
}

const PLACEHOLDER_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect fill="%23f1f5f9" width="100" height="100"/%3E%3Ctext x="50" y="50" font-family="sans-serif" font-size="12" text-anchor="middle" dy=".3em" fill="%2394a3b8"%3ENo image%3C/text%3E%3C/svg%3E';

export const Cart: React.FC = () => {
  const { cart, refreshCart } = useCart();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<CartItem | null>(null);

  useEffect(() => {
    const fetchCart = async () => {
      if (cart) {
        setItems(cart.items || []);
        setTotal(Number(cart.total_price) || 0);
        setLoading(false);
      } else {
        try {
          const data = await cartService.getCart();
          setItems(data.items || []);
          setTotal(Number(data.total_price) || 0);
        } catch (err) {
          console.error('Failed to fetch cart', err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchCart();
  }, [cart]);

  const updateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    try {
      await cartService.updateCartItem(itemId, { quantity: newQuantity });
      await refreshCart();
    } catch (err) {
      console.error('Failed to update quantity', err);
    }
  };

  const handleRemoveClick = (item: CartItem) => {
    setItemToRemove(item);
    setModalOpen(true);
  };

  const confirmRemove = async () => {
    if (!itemToRemove) return;
    try {
      await cartService.removeFromCart(itemToRemove.id);
      await refreshCart();
    } catch (err) {
      console.error('Failed to remove item', err);
    } finally {
      setModalOpen(false);
      setItemToRemove(null);
    }
  };

  const cancelRemove = () => {
    setModalOpen(false);
    setItemToRemove(null);
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (loading) return <div className={styles.loading}>Loading cart...</div>;
  if (items.length === 0) {
    return (
      <div className={styles.emptyCart}>
        <h2>Your cart is empty</h2>
        <Link to="/shop" className={styles.continueShopping}>Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1>Shopping Cart</h1>
      <div className={styles.cartItems}>
        {items.map((item) => (
          <div key={item.id} className={styles.cartItem}>
            <div className={styles.itemImage}>
              <img
                src={item.product.primary_image || PLACEHOLDER_IMAGE}
                alt={item.product.name}
              />
            </div>
            <div className={styles.itemDetails}>
              <div className={styles.itemName}>{item.product.name}</div>
              <div className={styles.itemPrice}>NRs. {item.product.price}</div>
              <div className={styles.itemQuantity}>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                  +
                </button>
              </div>
              <div className={styles.itemTotal}>NRs. {item.total_price}</div>
            </div>
            <button
              className={styles.removeBtn}
              onClick={() => handleRemoveClick(item)}
              aria-label="Remove item"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className={styles.cartSummary}>
        <div className={styles.totalRow}>
          <span>Total:</span>
          <span className={styles.totalPrice}>NRs. {total.toFixed(2)}</span>
        </div>
        <button className={styles.checkoutBtn} onClick={handleCheckout}>
          Proceed to Checkout 
        </button>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalOpen}
        title="Remove Item"
        message={`Do you want to remove "${itemToRemove?.product.name}" from the cart?`}
        confirmText="Remove"
        cancelText="Cancel"
        onConfirm={confirmRemove}
        onCancel={cancelRemove}
      />
    </div>
  );
};