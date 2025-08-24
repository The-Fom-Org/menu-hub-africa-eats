
import { useState, useEffect, useCallback, useRef } from 'react';

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
  const isInitialized = useRef(false);
  const storageKey = `cart_${restaurantId}`;

  console.log('🛒 useCart hook render:', {
    restaurantId,
    cartItemsCount: cartItems.length,
    isUpdating,
    isInitialized: isInitialized.current
  });

  // Load cart from localStorage on mount
  useEffect(() => {
    if (isInitialized.current) return;
    
    console.log('🔄 Loading cart from localStorage for restaurant:', restaurantId);
    
    try {
      const savedCart = localStorage.getItem(storageKey);
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        console.log('✅ Cart loaded successfully:', parsed);
        setCartItems(parsed);
      } else {
        console.log('ℹ️ No saved cart found');
        setCartItems([]);
      }
    } catch (error) {
      console.error('❌ Error loading cart from localStorage:', error);
      localStorage.removeItem(storageKey);
      setCartItems([]);
    }
    
    isInitialized.current = true;
  }, [restaurantId, storageKey]);

  // Save to localStorage function
  const saveToLocalStorage = useCallback((items: CartItem[]) => {
    try {
      console.log('💾 Saving cart to localStorage:', items);
      localStorage.setItem(storageKey, JSON.stringify(items));
      return true;
    } catch (error) {
      console.error('❌ Error saving cart to localStorage:', error);
      return false;
    }
  }, [storageKey]);

  // Validate cart operation
  const validateOperation = useCallback((
    expectedItems: CartItem[],
    actualItems: CartItem[],
    operation: string
  ): boolean => {
    const isValid = JSON.stringify(expectedItems) === JSON.stringify(actualItems);
    console.log(`🔍 Validating ${operation}:`, {
      expected: expectedItems,
      actual: actualItems,
      isValid
    });
    return isValid;
  }, []);

  const addToCart = useCallback((item: Omit<CartItem, 'quantity'>) => {
    console.log('➕ Adding to cart:', item);
    setIsUpdating(true);
    
    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(cartItem => 
        cartItem.id === item.id && 
        cartItem.customizations === item.customizations
      );
      
      let newItems: CartItem[];
      
      if (existingItemIndex !== -1) {
        // Update existing item
        newItems = prevItems.map((cartItem, index) =>
          index === existingItemIndex
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
        console.log('📈 Updated existing item quantity');
      } else {
        // Add new item
        newItems = [...prevItems, { ...item, quantity: 1 }];
        console.log('🆕 Added new item to cart');
      }
      
      // Save to localStorage
      const saved = saveToLocalStorage(newItems);
      if (!saved) {
        console.error('❌ Failed to save cart to localStorage');
      }
      
      console.log('✅ Cart updated successfully:', newItems);
      setIsUpdating(false);
      return newItems;
    });
  }, [saveToLocalStorage]);

  const removeFromCart = useCallback((itemId: string, customizations?: string) => {
    console.log('🗑️ Removing from cart:', { itemId, customizations });
    setIsUpdating(true);
    
    setCartItems(prevItems => {
      const newItems = prevItems.filter(item => 
        !(item.id === itemId && item.customizations === customizations)
      );
      
      // Save to localStorage
      const saved = saveToLocalStorage(newItems);
      if (!saved) {
        console.error('❌ Failed to save cart to localStorage');
      }
      
      console.log('✅ Item removed successfully:', newItems);
      setIsUpdating(false);
      return newItems;
    });
  }, [saveToLocalStorage]);

  const updateQuantity = useCallback((itemId: string, quantity: number, customizations?: string) => {
    console.log('🔄 Updating quantity:', { itemId, quantity, customizations });
    setIsUpdating(true);
    
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
      
      // Save to localStorage
      const saved = saveToLocalStorage(newItems);
      if (!saved) {
        console.error('❌ Failed to save cart to localStorage');
      }
      
      console.log('✅ Quantity updated successfully:', newItems);
      setIsUpdating(false);
      return newItems;
    });
  }, [removeFromCart, saveToLocalStorage]);

  const clearCart = useCallback(() => {
    console.log('🧹 Clearing cart');
    setIsUpdating(true);
    setCartItems([]);
    localStorage.removeItem(storageKey);
    setIsUpdating(false);
  }, [storageKey]);

  const syncCart = useCallback(() => {
    console.log('🔄 Syncing cart from localStorage');
    try {
      const savedCart = localStorage.getItem(storageKey);
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        setCartItems(parsed);
        console.log('✅ Cart synced successfully:', parsed);
        return true;
      }
      return true;
    } catch (error) {
      console.error('❌ Error syncing cart:', error);
      return false;
    }
  }, [storageKey]);

  // Computed values with logging
  const getCartTotal = useCallback(() => {
    const total = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    console.log('💰 Cart total calculated:', { total, itemCount: cartItems.length });
    return total;
  }, [cartItems]);

  const getCartCount = useCallback(() => {
    const count = cartItems.reduce((count, item) => count + item.quantity, 0);
    console.log('🔢 Cart count calculated:', { count, itemsLength: cartItems.length });
    return count;
  }, [cartItems]);

  const hasItems = useCallback(() => {
    const has = cartItems.length > 0;
    console.log('❓ Cart has items:', { has, length: cartItems.length });
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
