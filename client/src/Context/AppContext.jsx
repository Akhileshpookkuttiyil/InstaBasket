import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AppContext } from "./appContext";
import apiClient from "../shared/lib/apiClient";
import { env } from "../shared/config/env";

export const AppContextProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isSeller, setIsSeller] = useState(false);
  const [showUserLogin, setshowUserLogin] = useState(false);
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState({});
  const [searchQuery, setsearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchSellerStatus = async () => {
    try {
      const { data } = await apiClient.get("/api/seller/auth");
      setIsSeller(Boolean(data.success));
    } catch {
      setIsSeller(false);
    }
  };

  const fetchUser = async () => {
    try {
      const { data } = await apiClient.get("/api/user/auth");
      if (data.success) {
        setUser(data.user || null);
        setCartItems(data.user.cartItems || {});
      } else {
        toast.error(data.message);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await apiClient.get("/api/products/all");
      if (data.success) {
        setProducts(data.products);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error.message);
    }
  };

  const addToCart = (itemId) => {
    setCartItems((prevCart) => {
      const cartData = { ...prevCart };
      cartData[itemId] = (cartData[itemId] || 0) + 1;
      return cartData;
    });
    toast.success("Item added to cart", { style: { background: "#fff", color: "#000" } });
  };

  const updateCartItem = (itemId, quantity) => {
    setCartItems((prevCart) => {
      const cartData = { ...prevCart };
      cartData[itemId] = quantity;
      return cartData;
    });
    toast.success("Item updated in cart", { style: { background: "#fff", color: "#000" } });
  };

  const removeFromCart = (itemId) => {
    setCartItems((prevCart) => {
      const cartData = { ...prevCart };
      if (cartData[itemId]) {
        cartData[itemId] -= 1;
        if (cartData[itemId] === 0) {
          delete cartData[itemId];
        }
        toast.success("Item removed from cart", {
          style: { background: "#fff", color: "#000" },
        });
      }
      return cartData;
    });
  };

  const getCartCount = () => {
    let totalCount = 0;
    for (const item in cartItems) {
      totalCount += cartItems[item];
    }
    return totalCount;
  };

  const getCartAmount = () => {
    let totalAmount = 0;
    for (const item in cartItems) {
      const product = products.find((productItem) => productItem._id === item);
      if (product) {
        totalAmount += product.offerPrice * cartItems[item];
      }
    }
    return Math.floor(totalAmount * 100) / 100;
  };

  useEffect(() => {
    fetchSellerStatus();
    fetchProducts();
    fetchUser();
  }, []);

  useEffect(() => {
    const updateUserCart = async () => {
      if (user) {
        try {
          await apiClient.post("/api/cart/update", { cartData: cartItems });
        } catch (error) {
          toast.error(error.message);
        }
      }
    };

    updateUserCart();
  }, [cartItems, user]);

  const value = {
    navigate,
    user,
    setUser,
    isSeller,
    setIsSeller,
    showUserLogin,
    setshowUserLogin,
    products,
    currency: env.currency,
    addToCart,
    updateCartItem,
    removeFromCart,
    cartItems,
    searchQuery,
    setsearchQuery,
    getCartAmount,
    getCartCount,
    axios: apiClient,
    fetchProducts,
    loading,
    setLoading,
    setCartItems,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
