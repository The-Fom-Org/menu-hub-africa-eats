
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
  const [cartVersion, setCartVersion] = useState(0); // Force re-renders

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(`cart_${restaurantId}`);
    if (savedCart) {
      const parsed = JSON.parse(savedCart);
      setCartItems(parsed);
      console.log('Cart loaded from localStorage:', parsed);
    }
  }, [restaurantId]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(`cart_${restaurantId}`, JSON.stringify(cartItems));
    setCartVersion(prev => prev + 1); // Trigger re-renders
    console.log('Cart saved to localStorage:', cartItems);
  }, [cartItems, restaurantId]);

  const addToCart = useCallback((item: Omit<CartItem, 'quantity'>) => {
    console.log('Adding to cart:', item);
    setCartItems(prev => {
      const existingItem = prev.find(cartItem => 
        cartItem.id === item.id && 
        cartItem.customizations === item.customizations
      );
      
      let newCart;
      if (existingItem) {
        newCart = prev.map(cartItem =>
          cartItem.id === item.id && cartItem.customizations === item.customizations
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        newCart = [...prev, { ...item, quantity: 1 }];
      }
      
      console.log('New cart state:', newCart);
      return newCart;
    });
  }, []);

  const removeFromCart = useCallback((itemId: string, customizations?: string) => {
    console.log('Removing from cart:', itemId, customizations);
    setCartItems(prev => {
      const newCart = prev.filter(item => 
        !(item.id === itemId && item.customizations === customizations)
      );
      console.log('Cart after removal:', newCart);
      return newCart;
    });
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number, customizations?: string) => {
    console.log('Updating quantity:', itemId, quantity, customizations);
    if (quantity <= 0) {
      removeFromCart(itemId, customizations);
      return;
    }
    
    setCartItems(prev => {
      const newCart = prev.map(item =>
        item.id === itemId && item.customizations === customizations
          ? { ...item, quantity }
          : item
      );
      console.log('Cart after quantity update:', newCart);
      return newCart;
    });
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    console.log('Clearing cart');
    setCartItems([]);
    localStorage.removeItem(`cart_${restaurantId}`);
  }, [restaurantId]);

  const getCartTotal = useCallback(() => {
    const total = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    console.log('Cart total:', total);
    return total;
  }, [cartItems]);

  const getCartCount = useCallback(() => {
    const count = cartItems.reduce((count, item) => count + item.quantity, 0);
    console.log('Cart count:', count);
    return count;
  }, [cartItems]);

  const getOrderDetails = useCallback((): OrderDetails => ({
    items: cartItems,
    total: getCartTotal(),
    order_type: orderType,
    customer_name: orderType === 'later' ? customerInfo.name : undefined,
    customer_phone: orderType === 'later' ? customerInfo.phone : undefined,
    preferred_time: orderType === 'later' ? customerInfo.preferred_time : undefined,
    restaurant_id: restaurantId,
  }), [cartItems, getCartTotal, orderType, customerInfo, restaurantId]);

  return {
    cartItems,
    orderType,
    setOrderType,
    customerInfo,
    setCustomerInfo,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    getOrderDetails,
    cartVersion, // Expose for forcing re-renders
  };
};
