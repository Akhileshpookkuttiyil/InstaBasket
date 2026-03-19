import React, { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import apiClient from "../shared/lib/apiClient";
import useCartStore from "../store/useCartStore";

const Loading = () => {
  const navigate = useNavigate();
  const { fetchUserCart } = useCartStore();
  const { search } = useLocation();
  const { sessionId, nextUrl } = useMemo(() => {
    const query = new URLSearchParams(search);
    return {
      sessionId: query.get("session_id"),
      nextUrl: query.get("next"),
    };
  }, [search]);

  useEffect(() => {
    const verifyPayment = async () => {
      if (sessionId) {
        try {
          await apiClient.get(`/api/order/verify-payment?sessionId=${sessionId}`);
          await fetchUserCart();
        } catch (error) {
          console.error("Payment verification fallback failed:", error);
        }
      }

      if (nextUrl) {
        setTimeout(() => {
          navigate(`/${nextUrl}`);
        }, 3000);
      }
    };

    verifyPayment();
  }, [sessionId, nextUrl, navigate, fetchUserCart]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-primary" />
    </div>
  );
};

export default Loading;
