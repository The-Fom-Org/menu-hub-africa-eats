
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

  // Force component re-renders when cart changes
  const [, forceUpdate] = useState(0);
  const triggerUpdate = useCallback(() => {
    forceUpdate(prev => prev + 1);
  }, []);

  // Load cart from localStorage on mount
  useEffect(() => {
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
  }, [restaurantId]);

  // Save cart to localStorage
  const saveCart = useCallback((items: CartItem[]) => {
    try {
      localStorage.setItem(`cart_${restaurantId}`, JSON.stringify(items));
      console.log('Cart saved to localStorage:', items);
      triggerUpdate();
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [restaurantId, triggerUpdate]);

  const addToCart = useCallback((item: Omit<CartItem, 'quantity'>) => {
    console.log('Adding to cart:', item);
    setCartItems(prevItems => {
      const existingItem = prevItems.find(cartItem => 
        cartItem.id === item.id && 
        cartItem.customizations === item.customizations
      );
      
      let newItems: CartItem[];
      if (existingItem) {
        newItems = prevItems.map(cartItem =>
          cartItem.id === item.id && cartItem.customizations === item.customizations
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        newItems = [...prevItems, { ...item, quantity: 1 }];
      }
      
      console.log('New cart state after add:', newItems);
      saveCart(newItems);
      return newItems;
    });
  }, [saveCart]);

  const removeFromCart = useCallback((itemId: string, customizations?: string) => {
    console.log('Removing from cart:', itemId, customizations);
    setCartItems(prevItems => {
      const newItems = prevItems.filter(item => 
        !(item.id === itemId && item.customizations === customizations)
      );
      console.log('Cart after removal:', newItems);
      saveCart(newItems);
      return newItems;
    });
  }, [saveCart]);

  const updateQuantity = useCallback((itemId: string, quantity: number, customizations?: string) => {
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
      saveCart(newItems);
      return newItems;
    });
  }, [removeFromCart, saveCart]);

  const clearCart = useCallback(() => {
    console.log('Clearing cart');
    setCartItems([]);
    localStorage.removeItem(`cart_${restaurantId}`);
    triggerUpdate();
  }, [restaurantId, triggerUpdate]);

  const getCartTotal = useCallback(() => {
    const total = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    console.log('Cart total calculated:', total);
    return total;
  }, [cartItems]);

  const getCartCount = useCallback(() => {
    const count = cartItems.reduce((count, item) => count + item.quantity, 0);
    console.log('Cart count calculated:', count);
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
  };
};
