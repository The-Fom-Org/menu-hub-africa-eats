
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
  const [isUpdating, setIsUpdating] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(`cart_${restaurantId}`);
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        console.log('Cart loaded from localStorage:', parsed);
        setCartItems(parsed);
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        localStorage.removeItem(`cart_${restaurantId}`);
        setCartItems([]);
      }
    }
  }, [restaurantId]);

  // Save cart to localStorage whenever cartItems changes
  useEffect(() => {
    try {
      localStorage.setItem(`cart_${restaurantId}`, JSON.stringify(cartItems));
      console.log('Cart saved to localStorage:', cartItems);
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cartItems, restaurantId]);

  const addToCart = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setIsUpdating(true);
    console.log('Adding to cart:', item);
    
    setCartItems(prevItems => {
      const existingItem = prevItems.find(cartItem => 
        cartItem.id === item.id && 
        cartItem.customizations === item.customizations
      );
      
      let newItems;
      if (existingItem) {
        newItems = prevItems.map(cartItem =>
          cartItem.id === item.id && cartItem.customizations === item.customizations
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        newItems = [...prevItems, { ...item, quantity: 1 }];
      }
      
      console.log('Cart updated:', newItems);
      return newItems;
    });
    
    // Use setTimeout to ensure state update is processed
    setTimeout(() => setIsUpdating(false), 100);
  }, []);

  const removeFromCart = useCallback((itemId: string, customizations?: string) => {
    setIsUpdating(true);
    console.log('Removing from cart:', itemId, customizations);
    
    setCartItems(prevItems => {
      const newItems = prevItems.filter(item => 
        !(item.id === itemId && item.customizations === customizations)
      );
      console.log('Cart after removal:', newItems);
      return newItems;
    });
    
    setTimeout(() => setIsUpdating(false), 100);
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number, customizations?: string) => {
    setIsUpdating(true);
    console.log('Updating quantity:', itemId, quantity, customizations);
    
    if (quantity <= 0) {
      removeFromCart(itemId, customizations);
      return;
    }
    
    setCartItems(prevItems => {
      const newItems = prevItems.map(item =>
        item.id === itemId && item.customizations === customizations
          ? { ...item, quantity }
          : item
      );
      console.log('Cart after quantity update:', newItems);
      return newItems;
    });
    
    setTimeout(() => setIsUpdating(false), 100);
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setIsUpdating(true);
    console.log('Clearing cart');
    setCartItems([]);
    localStorage.removeItem(`cart_${restaurantId}`);
    setTimeout(() => setIsUpdating(false), 100);
  }, [restaurantId]);

  const syncCart = useCallback(() => {
    console.log('Syncing cart from localStorage');
    const savedCart = localStorage.getItem(`cart_${restaurantId}`);
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        setCartItems(parsed);
        console.log('Cart synced:', parsed);
        return true;
      } catch (error) {
        console.error('Error syncing cart:', error);
        return false;
      }
    }
    return true;
  }, [restaurantId]);

  const getCartTotal = useCallback(() => {
    const total = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    console.log('Cart total calculated:', total, 'from items:', cartItems);
    return total;
  }, [cartItems]);

  const getCartCount = useCallback(() => {
    const count = cartItems.reduce((count, item) => count + item.quantity, 0);
    console.log('Cart count calculated:', count, 'from items:', cartItems);
    return count;
  }, [cartItems]);

  const hasItems = useCallback(() => {
    const has = cartItems.length > 0;
    console.log('Cart has items:', has, 'items:', cartItems);
    return has;
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
    syncCart,
    getCartTotal,
    getCartCount,
    hasItems,
    getOrderDetails,
    isUpdating,
  };
};
