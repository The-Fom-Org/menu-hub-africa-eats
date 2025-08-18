
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

  console.log('useCart hook initialized for restaurant:', restaurantId);

  // Load cart from localStorage on mount and when restaurantId changes
  useEffect(() => {
    const loadCart = () => {
      console.log('Loading cart for restaurant:', restaurantId);
      
      try {
        // First check for preserved cart (from reload)
        const preservedCart = localStorage.getItem(`cart_preserve_${restaurantId}`);
        
        if (preservedCart) {
          const parsed = JSON.parse(preservedCart);
          const isRecent = (Date.now() - parsed.timestamp) < 30000; // 30 seconds
          
          if (isRecent && parsed.restaurantId === restaurantId && parsed.items) {
            console.log('Restored cart from preserve storage:', parsed.items);
            setCartItems(parsed.items);
            
            // Clean up the preserve storage after successful restore
            localStorage.removeItem(`cart_preserve_${restaurantId}`);
            
            // Update the regular cart storage
            localStorage.setItem(`cart_${restaurantId}`, JSON.stringify(parsed.items));
            return;
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
          setCartItems(items);
          return;
        }
        
      } catch (error) {
        console.error('Error restoring cart:', error);
        // Clean up corrupted data
        localStorage.removeItem(`cart_preserve_${restaurantId}`);
        localStorage.removeItem(`cart_${restaurantId}`);
      }
      
      console.log('No cart to restore');
      setCartItems([]);
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

  // Function to preserve cart during page reloads
  const preserveCartBeforeReload = useCallback((items: CartItem[]) => {
    console.log('Preserving cart before reload for restaurant:', restaurantId, 'items:', items);
    
    if (items.length >= 0) { // Changed from > 0 to >= 0 to handle empty carts too
      const cartWithTimestamp = {
        items: items,
        timestamp: Date.now(),
        restaurantId: restaurantId
      };
      
      try {
        localStorage.setItem(`cart_preserve_${restaurantId}`, JSON.stringify(cartWithTimestamp));
        console.log('Cart preserved successfully');
        return true;
      } catch (error) {
        console.error('Failed to preserve cart:', error);
        return false;
      }
    }
    return true;
  }, [restaurantId]);

  const addToCart = useCallback((item: Omit<CartItem, 'quantity'>) => {
    console.log('Adding to cart:', item);
    
    const existingItem = cartItems.find(cartItem => 
      cartItem.id === item.id && 
      cartItem.customizations === item.customizations
    );
    
    let updatedItems;
    if (existingItem) {
      updatedItems = cartItems.map(cartItem =>
        cartItem.id === item.id && cartItem.customizations === item.customizations
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      );
      console.log('Updated existing item quantity, new cart:', updatedItems);
    } else {
      updatedItems = [...cartItems, { ...item, quantity: 1 }];
      console.log('Added new item to cart, new cart:', updatedItems);
    }
    
    // Preserve cart before triggering reload
    if (preserveCartBeforeReload(updatedItems)) {
      // Trigger page reload to refresh cart display
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } else {
      // If preservation failed, just update the state normally
      setCartItems(updatedItems);
    }
  }, [cartItems, restaurantId, preserveCartBeforeReload]);

  const removeFromCart = useCallback((itemId: string, customizations?: string) => {
    console.log('Removing from cart:', itemId, customizations);
    
    const updated = cartItems.filter(item => 
      !(item.id === itemId && item.customizations === customizations)
    );
    console.log('Item removed, new cart:', updated);
    
    // Preserve cart before triggering reload
    if (preserveCartBeforeReload(updated)) {
      // Trigger page reload to refresh cart display
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } else {
      // If preservation failed, just update the state normally
      setCartItems(updated);
    }
  }, [cartItems, restaurantId, preserveCartBeforeReload]);

  const updateQuantity = useCallback((itemId: string, quantity: number, customizations?: string) => {
    console.log('Updating quantity:', itemId, 'to', quantity, customizations);
    
    if (quantity <= 0) {
      removeFromCart(itemId, customizations);
      return;
    }
    
    const updated = cartItems.map(item =>
      item.id === itemId && item.customizations === customizations
        ? { ...item, quantity }
        : item
    );
    console.log('Quantity updated, new cart:', updated);
    
    // Preserve cart before triggering reload
    if (preserveCartBeforeReload(updated)) {
      // Trigger page reload to refresh cart display
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } else {
      // If preservation failed, just update the state normally
      setCartItems(updated);
    }
  }, [cartItems, restaurantId, removeFromCart, preserveCartBeforeReload]);

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
