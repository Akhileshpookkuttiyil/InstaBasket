import { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { dummyProducts } from "../assets/assets";
import toast from "react-hot-toast";

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const currency = import.meta.env.VITE_CURRENCY; // App currency from environment
  const navigate = useNavigate();

  // State variables
  const [user, setUser] = useState(null);
  const [isSeller, setIsSeller] = useState(false);
  const [showUserLogin, setshowUserLogin] = useState(false);
  const [products, setProducts] = useState([]);
  const [cartItems, setcartItems] = useState({});
  const [searchQuery, setsearchQuery] = useState("");

  // Fetch dummy products
  const fetchProducts = async () => {
    try {
      setProducts(dummyProducts); // Replace with API logic if needed
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  // Add item to cart
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

  // Update item quantity in cart
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

  // Remove item from cart
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

  // Get total item count in cart
  const getCartCount = () => {
    let totalCount = 0;
    for (const item in cartItems) {
      totalCount += cartItems[item];
    }
    return totalCount;
  };

  // Calculate total price of items in the cart
  const getCartAmount = () => {
    let totalAmount = 0;
    for (const item in cartItems) {
      const product = products.find((product) => product._id === item);
      if (product) {
        totalAmount += product.offerPrice * cartItems[item];
      }
    }
    return Math.floor(totalAmount * 100) / 100; // Round to 2 decimal places
  };

  // Load products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Shared context value
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
