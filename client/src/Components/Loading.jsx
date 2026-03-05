import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Loading = () => {
  const navigate = useNavigate();
  let { search } = useLocation();
  const query = new URLSearchParams(search);
  const nexturl = query.get("next");

  useEffect(() => {
    if (nexturl) {
      setTimeout(() => {
        navigate(`/${nexturl}`);
      }, 3000);
    }
  }, [nexturl, navigate]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-primary"></div>
    </div>
  );
};

export default Loading;
