import React, { useEffect, useState } from "react";

const OtpVerificationForm = ({
  otp,
  setOtp,
  onSubmit,
  onResend,
  onClose,
  email,
}) => {
  const [resendTimer, setResendTimer] = useState(60);

  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  const handleOtpChange = (e, index) => {
    const value = e.target.value;
    if (!/^\d*$/.test(value)) return;

    const updatedOtp = [...otp];
    updatedOtp[index] = value;
    setOtp(updatedOtp);

    if (value && index < 5) {
      document.getElementById(`otp-input-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-input-${index - 1}`)?.focus();
    }
  };

  const handleResendClick = () => {
    if (resendTimer === 0) {
      onResend();
      setResendTimer(60);
    }
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="relative flex flex-col items-center w-[380px] md:max-w-[423px] bg-white rounded-2xl shadow-lg p-6 sm:p-10"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-500 hover:text-black text-xl"
      >
        &times;
      </button>

      <p className="text-2xl font-semibold text-gray-900">Email Verify OTP</p>
      <p className="mt-2 text-sm text-gray-900/90 text-center">
        Enter the 6-digit code sent to {email}
      </p>

      <div className="grid grid-cols-6 gap-2 sm:gap-3 w-11/12 mt-8">
        {otp.map((digit, index) => (
          <input
            key={index}
            id={`otp-input-${index}`}
            type="text"
            maxLength="1"
            value={digit}
            onChange={(e) => handleOtpChange(e, index)}
            onKeyDown={(e) => handleOtpKeyDown(e, index)}
            className="w-full h-12 bg-indigo-50 text-gray-900 text-xl rounded-md outline-none text-center"
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onSubmit}
        className="mt-8 w-full max-w-80 h-11 rounded-full text-white text-sm bg-indigo-500 hover:opacity-90 transition-opacity"
      >
        Verify Email
      </button>

      <button
        type="button"
        onClick={handleResendClick}
        disabled={resendTimer > 0}
        className={`mt-4 text-sm ${
          resendTimer > 0
            ? "text-gray-400 cursor-not-allowed"
            : "text-indigo-500 hover:underline"
        }`}
      >
        Resend OTP
      </button>

      {resendTimer > 0 && (
        <p className="mt-1 text-sm text-gray-500">
          You can resend OTP in{" "}
          <span className="font-medium">{resendTimer}s</span>
        </p>
      )}
    </div>
  );
};

export default OtpVerificationForm;
