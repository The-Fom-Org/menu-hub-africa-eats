
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

// Function to preserve cart during page reloads
const preserveCartOnReload = (restaurantId: string, cartItems: CartItem[]) => {
  console.log('Preserving cart before reload for restaurant:', restaurantId, 'items:', cartItems);
  
  if (cartItems.length > 0) {
    // Store cart with timestamp to prevent stale data
    const cartWithTimestamp = {
      items: cartItems,
      timestamp: Date.now(),
      restaurantId: restaurantId
    };
    
    try {
      localStorage.setItem(`cart_preserve_${restaurantId}`, JSON.stringify(cartWithTimestamp));
      console.log('Cart preserved successfully');
    } catch (error) {
      console.error('Failed to preserve cart:', error);
    }
  }
};

// Function to restore cart after page reload
const restoreCartAfterReload = (restaurantId: string): CartItem[] => {
  console.log('Attempting to restore cart for restaurant:', restaurantId);
  
  try {
    const preservedCart = localStorage.getItem(`cart_preserve_${restaurantId}`);
    
    if (preservedCart) {
      const parsed = JSON.parse(preservedCart);
      const isRecent = (Date.now() - parsed.timestamp) < 10000; // 10 seconds
      
      if (isRecent && parsed.restaurantId === restaurantId && parsed.items) {
        console.log('Restored cart from preserve storage:', parsed.items);
        
        // Clean up the preserve storage after successful restore
        localStorage.removeItem(`cart_preserve_${restaurantId}`);
        
        // Also update the regular cart storage
        localStorage.setItem(`cart_${restaurantId}`, JSON.stringify(parsed.items));
        
        return parsed.items;
      } else {
        console.log('Preserved cart expired or invalid, cleaning up');
        localStorage.removeItem(`cart_preserve_${restaurantId}`);
      }
    }
    
    // Fall back to regular cart storage
    const regularCart = localStorage.getItem(`cart_${restaurantId}`);
    if (regularCart) {
      const items = JSON.parse(regularCart);
      console.log('Restored cart from regular storage:', items);
      return items;
    }
    
  } catch (error) {
    console.error('Error restoring cart:', error);
    // Clean up corrupted data
    localStorage.removeItem(`cart_preserve_${restaurantId}`);
    localStorage.removeItem(`cart_${restaurantId}`);
  }
  
  console.log('No cart to restore');
  return [];
};

export const useCart = (restaurantId: string) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<'now' | 'later'>('now');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    preferred_time: '',
  });

  console.log('useCart hook initialized for restaurant:', restaurantId);

  // Load cart from localStorage on mount and when restaurantId changes
  useEffect(() => {
    const loadCart = () => {
      console.log('Loading cart for restaurant:', restaurantId);
      const restoredItems = restoreCartAfterReload(restaurantId);
      setCartItems(restoredItems);
    };
    
    loadCart();
  }, [restaurantId]);

  // Save cart to localStorage whenever cartItems changes
  useEffect(() => {
    console.log('Cart items changed, saving to localStorage:', cartItems);
    
    if (cartItems.length > 0) {
      try {
        localStorage.setItem(`cart_${restaurantId}`, JSON.stringify(cartItems));
        console.log('Cart saved to localStorage for restaurant:', restaurantId);
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    } else {
      localStorage.removeItem(`cart_${restaurantId}`);
      console.log('Empty cart, removed from localStorage for restaurant:', restaurantId);
    }
  }, [cartItems, restaurantId]);

  const addToCart = useCallback((item: Omit<CartItem, 'quantity'>) => {
    console.log('Adding to cart:', item);
    setCartItems(prevItems => {
      const existingItem = prevItems.find(cartItem => 
        cartItem.id === item.id && 
        cartItem.customizations === item.customizations
      );
      
      let updated;
      if (existingItem) {
        updated = prevItems.map(cartItem =>
          cartItem.id === item.id && cartItem.customizations === item.customizations
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
        console.log('Updated existing item quantity, new cart:', updated);
      } else {
        updated = [...prevItems, { ...item, quantity: 1 }];
        console.log('Added new item to cart, new cart:', updated);
      }
      
      // Preserve cart before triggering reload
      preserveCartOnReload(restaurantId, updated);
      
      // Trigger page reload to refresh cart display
      setTimeout(() => {
        window.location.reload();
      }, 100);
      
      return updated;
    });
  }, [restaurantId]);

  const removeFromCart = useCallback((itemId: string, customizations?: string) => {
    console.log('Removing from cart:', itemId, customizations);
    setCartItems(prevItems => {
      const updated = prevItems.filter(item => 
        !(item.id === itemId && item.customizations === customizations)
      );
      console.log('Item removed, new cart:', updated);
      
      // Preserve cart before triggering reload
      preserveCartOnReload(restaurantId, updated);
      
      // Trigger page reload to refresh cart display
      setTimeout(() => {
        window.location.reload();
      }, 100);
      
      return updated;
    });
  }, [restaurantId]);

  const updateQuantity = useCallback((itemId: string, quantity: number, customizations?: string) => {
    console.log('Updating quantity:', itemId, 'to', quantity, customizations);
    
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
      console.log('Quantity updated, new cart:', updated);
      
      // Preserve cart before triggering reload
      preserveCartOnReload(restaurantId, updated);
      
      // Trigger page reload to refresh cart display
      setTimeout(() => {
        window.location.reload();
      }, 100);
      
      return updated;
    });
  }, [restaurantId, removeFromCart]);

  const clearCart = useCallback(() => {
    console.log('Clearing cart for restaurant:', restaurantId);
    setCartItems([]);
    localStorage.removeItem(`cart_${restaurantId}`);
    localStorage.removeItem(`cart_preserve_${restaurantId}`);
  }, [restaurantId]);

  // Calculate totals
  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  console.log('useCart render - cartItems:', cartItems.length, 'total:', cartTotal, 'count:', cartCount);

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
  };
};
