import { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { dummyProducts } from "../assets/assets";
import toast from "react-hot-toast";

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const currency = import.meta.env.VITE_CURRENCY;
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isSeller, setIsSeller] = useState(false);
  const [showUserLogin, setshowUserLogin] = useState(false);
  const [products, setProducts] = useState([]);
  const [cartItems, setcartItems] = useState({});

  const fetchProducts = async () => {
    try {
      setProducts(dummyProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const addToCart = (itemId) => {
    setcartItems((prevCart) => {
      let cartData = { ...prevCart };
      cartData[itemId] = (cartData[itemId] || 0) + 1;
      return cartData;
    });

    toast.success("Item added to cart", {
      style: { background: "#fff", color: "#000" },
    });
  };

  const updateCartItem = (itemId, quantity) => {
    setcartItems((prevCart) => {
      let cartData = { ...prevCart };
      cartData[itemId] = quantity;
      return cartData;
    });

    toast.success("Item updated in cart", {
      style: { background: "#fff", color: "#000" },
    });
  };

  const removeFromCart = (itemId) => {
    setcartItems((prevCart) => {
      let cartData = { ...prevCart };
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

  useEffect(() => {
    fetchProducts();
  }, []);

  const value = {
    navigate,
    user,
    setUser,
    isSeller,
    setIsSeller,
    showUserLogin,
    setshowUserLogin,
    products,
    currency,
    addToCart,
    updateCartItem,
    removeFromCart,
    cartItems,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppContextProvider");
  }
  return context;
};
