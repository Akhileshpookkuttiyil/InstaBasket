import { create } from "zustand";
import toast from "react-hot-toast";
import apiClient from "../../../shared/lib/apiClient";
import useProductStore from "../../product/store/useProductStore";

const getProductStockState = (itemId) => {
  const products = useProductStore.getState().products || [];
  const product = products.find((entry) => String(entry._id) === String(itemId));
  const maxStock = Number(product?.countInStock || 0);
  const isAvailable = Boolean(product?.inStock) && maxStock > 0;

  return { product, maxStock, isAvailable };
};

const useCartStore = create((set, get) => ({
  cartItems: {},

  setCartItems: (items) => set({ cartItems: items || {} }),

  addToCart: async (itemId, user) => {
    const { product, maxStock, isAvailable } = getProductStockState(itemId);
    const currentQty = Number(get().cartItems?.[itemId] || 0);

    if (!product) {
      toast.error("Product unavailable");
      return false;
    }

    if (!isAvailable) {
      toast.error("Out of stock");
      return false;
    }

    if (currentQty >= maxStock) {
      toast.error(`Only ${maxStock} available in stock`);
      return false;
    }

    set((state) => {
      const newCart = { ...state.cartItems };
      newCart[itemId] = (newCart[itemId] || 0) + 1;
      return { cartItems: newCart };
    });

    toast.success("Added to cart");

    if (user) {
      const syncedCart = await get().updateUserCart(get().cartItems);
      if (syncedCart) {
        set({ cartItems: syncedCart });
      }
    }

    return true;
  },

  updateCartItem: async (itemId, quantity, user) => {
    const nextQuantity = Number(quantity);
    const { product, maxStock, isAvailable } = getProductStockState(itemId);

    if (!Number.isInteger(nextQuantity) || nextQuantity < 0) {
      toast.error("Invalid quantity");
      return;
    }

    if (!product || !isAvailable) {
      set((state) => {
        const newCart = { ...state.cartItems };
        delete newCart[itemId];
        return { cartItems: newCart };
      });

      if (user) {
        const syncedCart = await get().updateUserCart(get().cartItems);
        if (syncedCart) {
          set({ cartItems: syncedCart });
        }
      }
      return;
    }

    const safeQuantity = Math.min(nextQuantity, maxStock);

    set((state) => {
      const newCart = { ...state.cartItems };
      newCart[itemId] = safeQuantity;
      if (safeQuantity <= 0) {
        delete newCart[itemId];
      }
      return { cartItems: newCart };
    });

    if (safeQuantity < nextQuantity) {
      toast.error(`Only ${maxStock} available in stock`);
    }

    if (user) {
      const syncedCart = await get().updateUserCart(get().cartItems);
      if (syncedCart) {
        set({ cartItems: syncedCart });
      }
    }
  },

  removeFromCart: async (itemId, user) => {
    set((state) => {
      const newCart = { ...state.cartItems };
      if (newCart[itemId] > 1) {
        newCart[itemId] -= 1;
      } else {
        delete newCart[itemId];
      }
      return { cartItems: newCart };
    });

    toast.success("Removed from cart");

    if (user) {
      const syncedCart = await get().updateUserCart(get().cartItems);
      if (syncedCart) {
        set({ cartItems: syncedCart });
      }
    }
  },

  getCartCount: () => {
    const { cartItems } = get();
    return Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);
  },

  getCartAmount: (products) => {
    const { cartItems } = get();
    let total = 0;

    for (const id in cartItems) {
      const product = products.find((item) => item._id === id);
      if (product) {
        total += product.offerPrice * cartItems[id];
      }
    }

    return Math.floor(total * 100) / 100;
  },

  updateUserCart: async (cartData) => {
    try {
      const { data } = await apiClient.post("/api/cart/update", { cartData });
      if (data.success) {
        return data.cartItems || {};
      }
    } catch (error) {
      console.error("Sync cart failed:", error.message);
    }

    return null;
  },
}));

export default useCartStore;
