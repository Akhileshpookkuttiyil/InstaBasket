import { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
// import { dummyProducts } from "../assets/assets";
import toast from "react-hot-toast";

// Environment variable safety checks
if (!import.meta.env.VITE_BASE_URL) {
  console.warn("VITE_BASE_URL is not defined in your .env file.");
}
if (!import.meta.env.VITE_CURRENCY) {
  console.warn("VITE_CURRENCY is not defined in your .env file.");
}

// Axios default setup
axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const currency = import.meta.env.VITE_CURRENCY;
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [isSeller, setIsSeller] = useState(false);
  const [showUserLogin, setshowUserLogin] = useState(false);
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState({});
  const [searchQuery, setsearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  //fetch seller status

  const fetchSellerStatus = async () => {
    try {
      const { data } = await axios.get("/api/seller/auth");
      if (data.success) {
        setIsSeller(true);
      } else {
        setIsSeller(false);
      }
    } catch (error) {
      setIsSeller(false);
      console.log(error.message);
    }
  };

  //fetch user auth status and user cart items

  const fetchUser = async () => {
    try {
      const { data } = await axios.get("/api/user/auth");
      if (data.success) {
        setUser(data.user || null);
        setCartItems(data.user.cartItems);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      setUser(null);
      console.log(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      // setProducts(dummyProducts); // Replace with API logic if needed
      const { data } = await axios.get("/api/products/all");
      if (data.success) {
        setProducts(data.products);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const addToCart = (itemId) => {
    setCartItems((prevCart) => {
      const cartData = { ...prevCart };
      cartData[itemId] = (cartData[itemId] || 0) + 1;
      return cartData;
    });

    toast.success("Item added to cart", {
      style: { background: "#fff", color: "#000" },
    });
  };

  const updateCartItem = (itemId, quantity) => {
    setCartItems((prevCart) => {
      const cartData = { ...prevCart };
      cartData[itemId] = quantity;
      return cartData;
    });

    toast.success("Item updated in cart", {
      style: { background: "#fff", color: "#000" },
    });
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
      const product = products.find((product) => product._id === item);
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
          const { data } = await axios.post("/api/cart/update", {
            cartData: cartItems,
          });
          console.log("Updating user cart:", data.cartItems);
          if (data.success) {
            setUser((prevUser) => ({
              ...prevUser,
              cart: data.cart,
            }));
          } else {
            toast.error(data.message);
          }
        } catch (error) {
          toast.error(error.message);
        }
      }
    };

    updateUserCart();
  }, [cartItems]);

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
    searchQuery,
    setsearchQuery,
    getCartAmount,
    getCartCount,
    axios,
    fetchProducts,
    loading,
    setLoading,
    setCartItems,
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
