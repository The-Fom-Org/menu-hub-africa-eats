
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
  const [lastSyncTime, setLastSyncTime] = useState(Date.now());
  const isInitialized = useRef(false);
  const storageKey = `cart_${restaurantId}`;

  console.log('🛒 useCart hook render:', {
    restaurantId,
    cartItemsCount: cartItems.length,
    cartItems: cartItems.map(item => ({ id: item.id, name: item.name, quantity: item.quantity })),
    isUpdating,
    isInitialized: isInitialized.current,
    lastSyncTime
  });

  // Get latest cart state directly from localStorage - bypasses React state
  const getLatestCartState = useCallback((): CartItem[] => {
    try {
      const savedCart = localStorage.getItem(storageKey);
      const items = savedCart ? JSON.parse(savedCart) : [];
      console.log('📊 getLatestCartState:', items);
      return items;
    } catch (error) {
      console.error('❌ Error reading latest cart state:', error);
      return [];
    }
  }, [storageKey]);

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
        setLastSyncTime(Date.now());
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

  // Synchronous save to localStorage with validation
  const saveToLocalStorage = useCallback((items: CartItem[]): boolean => {
    try {
      console.log('💾 Saving cart to localStorage:', items);
      const serialized = JSON.stringify(items);
      localStorage.setItem(storageKey, serialized);
      
      // Immediate verification
      const verification = localStorage.getItem(storageKey);
      if (verification === serialized) {
        console.log('✅ Cart successfully saved and verified');
        setLastSyncTime(Date.now());
        return true;
      } else {
        console.error('❌ Cart save verification failed');
        return false;
      }
    } catch (error) {
      console.error('❌ Error saving cart to localStorage:', error);
      return false;
    }
  }, [storageKey]);

  // Force refresh cart from localStorage and update React state
  const forceRefresh = useCallback((): boolean => {
    console.log('🔄 Force refreshing cart from localStorage');
    try {
      const latestItems = getLatestCartState();
      console.log('✅ Force refresh successful:', latestItems);
      setCartItems(latestItems);
      setLastSyncTime(Date.now());
      return true;
    } catch (error) {
      console.error('❌ Error during force refresh:', error);
      setCartItems([]);
      return false;
    }
  }, [getLatestCartState]);

  // Emergency cart reset
  const resetCart = useCallback(() => {
    console.log('🚨 Emergency cart reset triggered');
    localStorage.removeItem(storageKey);
    setCartItems([]);
    setLastSyncTime(Date.now());
  }, [storageKey]);

  // Validate cart state consistency - uses latest localStorage data
  const validateCartState = useCallback((): { isValid: boolean; issues: string[]; latestItems: CartItem[] } => {
    const issues: string[] = [];
    
    try {
      const latestItems = getLatestCartState();
      
      if (JSON.stringify(cartItems) !== JSON.stringify(latestItems)) {
        issues.push('Cart state mismatch with localStorage');
      }
      
      const totalQuantity = latestItems.reduce((sum, item) => sum + item.quantity, 0);
      const hasItems = latestItems.length > 0;
      
      if (hasItems && totalQuantity === 0) {
        issues.push('Cart has items but zero total quantity');
      }
      
      if (!hasItems && totalQuantity > 0) {
        issues.push('Cart is empty but has non-zero total quantity');
      }
      
      console.log('🔍 Cart validation:', {
        reactStateItems: cartItems.length,
        localStorageItems: latestItems.length,
        totalQuantity,
        issues
      });
      
      return {
        isValid: issues.length === 0,
        issues,
        latestItems
      };
    } catch (error) {
      console.error('❌ Error validating cart state:', error);
      return {
        isValid: false,
        issues: ['Validation error: ' + (error instanceof Error ? error.message : 'Unknown error')],
        latestItems: []
      };
    }
  }, [cartItems, getLatestCartState]);

  // Create a unique key for cart items
  const getItemKey = useCallback((id: string, customizations?: string) => {
    return `${id}${customizations ? `_${customizations}` : ''}`;
  }, []);

  const addToCart = useCallback((item: Omit<CartItem, 'quantity'>) => {
    console.log('➕ Starting addToCart:', item);
    setIsUpdating(true);
    
    const itemKey = getItemKey(item.id, item.customizations);
    const existingItemIndex = cartItems.findIndex(cartItem => 
      getItemKey(cartItem.id, cartItem.customizations) === itemKey
    );
    
    let newItems: CartItem[];
    
    if (existingItemIndex !== -1) {
      // Update existing item
      newItems = cartItems.map((cartItem, index) =>
        index === existingItemIndex
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      );
      console.log('📈 Updated existing item quantity');
    } else {
      // Add new item
      const newItem = { ...item, quantity: 1 };
      newItems = [...cartItems, newItem];
      console.log('🆕 Added new item to cart');
    }
    
    console.log('🔄 New cart state:', newItems);
    
    // Update state and save synchronously
    setCartItems(newItems);
    const saved = saveToLocalStorage(newItems);
    setIsUpdating(false);
    
    console.log('✅ Cart operation completed:', { saved });
    return saved;
  }, [cartItems, saveToLocalStorage, getItemKey]);

  const removeFromCart = useCallback((itemId: string, customizations?: string) => {
    console.log('🗑️ Removing from cart:', { itemId, customizations });
    setIsUpdating(true);
    
    const itemKey = getItemKey(itemId, customizations);
    const newItems = cartItems.filter(item => 
      getItemKey(item.id, item.customizations) !== itemKey
    );
    
    console.log('🗑️ Items after removal:', newItems);
    
    setCartItems(newItems);
    const saved = saveToLocalStorage(newItems);
    setIsUpdating(false);
    
    return saved;
  }, [cartItems, saveToLocalStorage, getItemKey]);

  const updateQuantity = useCallback((itemId: string, quantity: number, customizations?: string) => {
    console.log('🔄 Updating quantity:', { itemId, quantity, customizations });
    
    if (quantity <= 0) {
      return removeFromCart(itemId, customizations);
    }
    
    setIsUpdating(true);
    
    const itemKey = getItemKey(itemId, customizations);
    const newItems = cartItems.map(item =>
      getItemKey(item.id, item.customizations) === itemKey
        ? { ...item, quantity }
        : item
    );
    
    console.log('🔄 Items after quantity update:', newItems);
    
    setCartItems(newItems);
    const saved = saveToLocalStorage(newItems);
    setIsUpdating(false);
    
    return saved;
  }, [cartItems, removeFromCart, saveToLocalStorage, getItemKey]);

  const clearCart = useCallback(() => {
    console.log('🧹 Clearing cart');
    setIsUpdating(true);
    setCartItems([]);
    localStorage.removeItem(storageKey);
    setLastSyncTime(Date.now());
    setIsUpdating(false);
  }, [storageKey]);

  // Direct calculations - no circular dependencies
  const getCartTotal = useCallback((items?: CartItem[]) => {
    const itemsToCalculate = items || cartItems;
    const total = itemsToCalculate.reduce((total, item) => total + (item.price * item.quantity), 0);
    console.log('💰 Cart total calculated:', { total, itemsCount: itemsToCalculate.length });
    return total;
  }, [cartItems]);

  const getCartCount = useCallback((items?: CartItem[]) => {
    const itemsToCalculate = items || cartItems;
    const count = itemsToCalculate.reduce((count, item) => count + item.quantity, 0);
    console.log('🔢 Cart count calculated:', { count, itemsLength: itemsToCalculate.length });
    return count;
  }, [cartItems]);

  // Simplified hasItems - no circular dependency
  const hasItems = useCallback((items?: CartItem[]) => {
    const itemsToCheck = items || cartItems;
    const count = itemsToCheck.reduce((total, item) => total + item.quantity, 0);
    const result = itemsToCheck.length > 0 && count > 0;
    console.log('❓ hasItems check:', { result, itemsLength: itemsToCheck.length, totalCount: count });
    return result;
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
    forceRefresh,
    resetCart,
    validateCartState,
    getLatestCartState,
    getCartTotal,
    getCartCount,
    hasItems,
    getOrderDetails,
    isUpdating,
    lastSyncTime,
  };
};
