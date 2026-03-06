import { create } from "zustand";
import toast from "react-hot-toast";
import apiClient from "../../../shared/lib/apiClient";

const useCartStore = create((set, get) => ({
  cartItems: {},

  setCartItems: (items) => set({ cartItems: items || {} }),

  addToCart: async (itemId, user) => {
    set((state) => {
      const newCart = { ...state.cartItems };
      newCart[itemId] = (newCart[itemId] || 0) + 1;
      return { cartItems: newCart };
    });

    toast.success("Added to cart");

    if (user) {
      await get().updateUserCart(get().cartItems);
    }
  },

  updateCartItem: async (itemId, quantity, user) => {
    set((state) => {
      const newCart = { ...state.cartItems };
      newCart[itemId] = quantity;
      if (quantity <= 0) {
        delete newCart[itemId];
      }
      return { cartItems: newCart };
    });

    if (user) {
      await get().updateUserCart(get().cartItems);
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
      await get().updateUserCart(get().cartItems);
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
      await apiClient.post("/api/cart/update", { cartData });
    } catch (error) {
      console.error("Sync cart failed:", error.message);
    }
  },
}));

export default useCartStore;
