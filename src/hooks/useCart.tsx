
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

  // Save to localStorage with better error handling
  const saveToLocalStorage = useCallback((items: CartItem[]): boolean => {
    try {
      console.log('💾 Saving cart to localStorage:', items);
      const serialized = JSON.stringify(items);
      localStorage.setItem(storageKey, serialized);
      
      // Verify the save worked
      const verification = localStorage.getItem(storageKey);
      if (verification === serialized) {
        console.log('✅ Cart successfully saved and verified');
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

  // Create a unique key for cart items
  const getItemKey = useCallback((id: string, customizations?: string) => {
    return `${id}${customizations ? `_${customizations}` : ''}`;
  }, []);

  const addToCart = useCallback((item: Omit<CartItem, 'quantity'>) => {
    console.log('➕ Starting addToCart:', item);
    
    return new Promise<boolean>((resolve) => {
      setIsUpdating(true);
      
      setCartItems(prevItems => {
        console.log('📋 Previous cart items:', prevItems);
        
        const itemKey = getItemKey(item.id, item.customizations);
        const existingItemIndex = prevItems.findIndex(cartItem => 
          getItemKey(cartItem.id, cartItem.customizations) === itemKey
        );
        
        let newItems: CartItem[];
        
        if (existingItemIndex !== -1) {
          // Update existing item
          newItems = prevItems.map((cartItem, index) =>
            index === existingItemIndex
              ? { ...cartItem, quantity: cartItem.quantity + 1 }
              : cartItem
          );
          console.log('📈 Updated existing item quantity:', newItems[existingItemIndex]);
        } else {
          // Add new item
          const newItem = { ...item, quantity: 1 };
          newItems = [...prevItems, newItem];
          console.log('🆕 Added new item to cart:', newItem);
        }
        
        console.log('🔄 New cart state:', newItems);
        
        // Save to localStorage
        const saved = saveToLocalStorage(newItems);
        
        // Use setTimeout to ensure state update completes
        setTimeout(() => {
          setIsUpdating(false);
          if (saved) {
            console.log('✅ Cart operation completed successfully');
            resolve(true);
          } else {
            console.error('❌ Failed to save to localStorage');
            resolve(false);
          }
        }, 50);
        
        return newItems;
      });
    });
  }, [saveToLocalStorage, getItemKey]);

  const removeFromCart = useCallback((itemId: string, customizations?: string) => {
    console.log('🗑️ Removing from cart:', { itemId, customizations });
    
    return new Promise<boolean>((resolve) => {
      setIsUpdating(true);
      
      setCartItems(prevItems => {
        const itemKey = getItemKey(itemId, customizations);
        const newItems = prevItems.filter(item => 
          getItemKey(item.id, item.customizations) !== itemKey
        );
        
        console.log('🗑️ Items after removal:', newItems);
        
        const saved = saveToLocalStorage(newItems);
        
        setTimeout(() => {
          setIsUpdating(false);
          resolve(saved);
        }, 50);
        
        return newItems;
      });
    });
  }, [saveToLocalStorage, getItemKey]);

  const updateQuantity = useCallback((itemId: string, quantity: number, customizations?: string) => {
    console.log('🔄 Updating quantity:', { itemId, quantity, customizations });
    
    if (quantity <= 0) {
      return removeFromCart(itemId, customizations);
    }
    
    return new Promise<boolean>((resolve) => {
      setIsUpdating(true);
      
      setCartItems(prevItems => {
        const itemKey = getItemKey(itemId, customizations);
        const newItems = prevItems.map(item =>
          getItemKey(item.id, item.customizations) === itemKey
            ? { ...item, quantity }
            : item
        );
        
        console.log('🔄 Items after quantity update:', newItems);
        
        const saved = saveToLocalStorage(newItems);
        
        setTimeout(() => {
          setIsUpdating(false);
          resolve(saved);
        }, 50);
        
        return newItems;
      });
    });
  }, [removeFromCart, saveToLocalStorage, getItemKey]);

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

  // Computed values
  const getCartTotal = useCallback(() => {
    const total = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    return total;
  }, [cartItems]);

  const getCartCount = useCallback(() => {
    const count = cartItems.reduce((count, item) => count + item.quantity, 0);
    return count;
  }, [cartItems]);

  const hasItems = useCallback(() => {
    return cartItems.length > 0;
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
