
import { useState, useEffect, useCallback } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  customizations?: string;
  special_instructions?: string;
}

export interface OrderDetails {
  items: CartItem[];
  total: number;
  order_type: 'now' | 'later';
  customer_name?: string;
  customer_phone?: string;
  preferred_time?: string;
  restaurant_id: string;
}

export const useCart = (restaurantId: string) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<'now' | 'later'>('now');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    preferred_time: '',
  });
  const [forceUpdate, setForceUpdate] = useState(0);

  // Load cart from localStorage on mount
  useEffect(() => {
    const loadCart = () => {
      const savedCart = localStorage.getItem(`cart_${restaurantId}`);
      if (savedCart) {
        try {
          const parsed = JSON.parse(savedCart);
          setCartItems(parsed);
          console.log('Cart loaded from localStorage:', parsed);
        } catch (error) {
          console.error('Error loading cart from localStorage:', error);
          localStorage.removeItem(`cart_${restaurantId}`);
        }
      }
    };
    
    loadCart();
  }, [restaurantId]);

  // Save cart to localStorage whenever cartItems changes
  useEffect(() => {
    if (cartItems.length > 0) {
      try {
        localStorage.setItem(`cart_${restaurantId}`, JSON.stringify(cartItems));
        console.log('Cart saved to localStorage:', cartItems);
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    } else {
      localStorage.removeItem(`cart_${restaurantId}`);
    }
    
    // Force all components using this hook to re-render
    setForceUpdate(prev => prev + 1);
  }, [cartItems, restaurantId]);

  const addToCart = useCallback((item: Omit<CartItem, 'quantity'>) => {
    console.log('Adding to cart:', item);
    setCartItems(prevItems => {
      const existingItem = prevItems.find(cartItem => 
        cartItem.id === item.id && 
        cartItem.customizations === item.customizations
      );
      
      if (existingItem) {
        const updated = prevItems.map(cartItem =>
          cartItem.id === item.id && cartItem.customizations === item.customizations
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
        console.log('Updated cart after add:', updated);
        return updated;
      } else {
        const updated = [...prevItems, { ...item, quantity: 1 }];
        console.log('Updated cart after add new:', updated);
        return updated;
      }
    });
  }, []);

  const removeFromCart = useCallback((itemId: string, customizations?: string) => {
    console.log('Removing from cart:', itemId, customizations);
    setCartItems(prevItems => {
      const updated = prevItems.filter(item => 
        !(item.id === itemId && item.customizations === customizations)
      );
      console.log('Updated cart after remove:', updated);
      return updated;
    });
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number, customizations?: string) => {
    console.log('Updating quantity:', itemId, quantity, customizations);
    if (quantity <= 0) {
      removeFromCart(itemId, customizations);
      return;
    }
    
    setCartItems(prevItems => {
      const updated = prevItems.map(item =>
        item.id === itemId && item.customizations === customizations
          ? { ...item, quantity }
          : item
      );
      console.log('Updated cart after quantity change:', updated);
      return updated;
    });
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    console.log('Clearing cart');
    setCartItems([]);
    localStorage.removeItem(`cart_${restaurantId}`);
  }, [restaurantId]);

  // Memoized calculations that will update when cartItems changes
  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  console.log('useCart render - cartItems:', cartItems, 'total:', cartTotal, 'count:', cartCount, 'forceUpdate:', forceUpdate);

  const getOrderDetails = useCallback((): OrderDetails => ({
    items: cartItems,
    total: cartTotal,
    order_type: orderType,
    customer_name: orderType === 'later' ? customerInfo.name : undefined,
    customer_phone: orderType === 'later' ? customerInfo.phone : undefined,
    preferred_time: orderType === 'later' ? customerInfo.preferred_time : undefined,
    restaurant_id: restaurantId,
  }), [cartItems, cartTotal, orderType, customerInfo, restaurantId]);

  return {
    cartItems,
    cartTotal,
    cartCount,
    orderType,
    setOrderType,
    customerInfo,
    setCustomerInfo,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getOrderDetails,
    forceUpdate, // Expose for debugging
  };
};
