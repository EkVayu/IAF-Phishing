import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import leftImage from "../assets/loginPlane.png";
import { useAuth } from "../context/AuthContext";
import {
  loginApi,
  sendPasswordResetOtp,
  verifyOtp,
  resetPassword,
} from "../Api/api";
import { MdOutlineEmail } from "react-icons/md";
import { HiLockClosed } from "react-icons/hi";
import { FaAngleLeft } from "react-icons/fa";
import { toast } from "react-toastify";
import { LuLoader } from "react-icons/lu";
import { validatePassword } from "../Validation";

function Login() {
  const [action, setAction] = useState("Login");
  const [resetStep, setResetStep] = useState(1); // 1: email, 2: OTP, 3: new password
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!userId.trim() || !password.trim()) {
      toast.error("Please enter both User ID and Password.");
      return;
    }

    if (!validateEmail(userId)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      const response = await loginApi({ email: userId, password });
      if (response.ok) {
        const data = await response.json();
        login(data.token, data.user, data.role);
        toast.success("Login successful!");
        navigate("/dashboard");
      } else {
        toast.error("Invalid user ID or password");
      }
    } catch (error) {
      toast.error("Error logging in: " + error.message);
    }
    setLoading(false);
  };

  const handleSendOtp = async () => {
    if (!validateEmail(userId)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const response = await sendPasswordResetOtp({ email: userId });
      if (response.ok) {
        toast.success("OTP sent to your email");
        setResetStep(2);
      } else {
        toast.error("Failed to send OTP");
      }
    } catch (error) {
      toast.error("Error sending OTP: " + error.message);
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter valid 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const response = await verifyOtp(userId, otp);
      if (response.ok) {
        toast.success("OTP verified successfully");
        setResetStep(3);
      } else {
        toast.error("Invalid OTP");
      }
    } catch (error) {
      toast.error("Error verifying OTP");
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!validatePassword(newPassword)) {
      toast.error(
        "Password must contain at least 8 characters, one letter, one number, and one special character"
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const response = await resetPassword(userId, otp, newPassword);
      if (response.ok) {
        toast.success("Password reset successful");
        setAction("Login");
        setResetStep(1);
      } else {
        toast.error("Failed to reset password");
      }
    } catch (error) {
      toast.error("Error resetting password");
    }
    setLoading(false);
  };

  const renderForgetPasswordContent = () => {
    switch (resetStep) {
      case 1:
        return (
          <>
            <div className="w-full flex items-center gap-5 bg-[#E8F0FE] px-5 py-2 rounded-md">
              <MdOutlineEmail className="w-8 h-8 text-gray-500" />
              <input
                type="email"
                placeholder="User email"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="bg-transparent outline-none bg w-full text-gray-800"
              />
            </div>
            <button
              onClick={handleSendOtp}
              className="bg-blue-800 px-8 py-2 rounded-full cursor-pointer text-white"
            >
              {loading ? (
                <span className="flex items-center">
                  <LuLoader className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                  Sending...
                </span>
              ) : (
                "Send OTP"
              )}
            </button>
          </>
        );
      case 2:
        return (
          <>
            <div className="w-full flex items-center gap-5 bg-[#E8F0FE] px-5 py-2 rounded-md">
              <HiLockClosed className="w-8 h-8 text-gray-500" />
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="bg-transparent outline-none bg w-full text-gray-800"
              />
            </div>
            <button
              onClick={handleVerifyOtp}
              className="bg-blue-800 px-8 py-2 rounded-full cursor-pointer text-white"
            >
              {loading ? (
                <span className="flex items-center">
                  <LuLoader className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                  Verifying...
                </span>
              ) : (
                "Verify OTP"
              )}
            </button>
          </>
        );
      case 3:
        return (
          <>
            <div className="w-full flex items-center gap-5 bg-[#E8F0FE] px-5 py-2 rounded-md">
              <HiLockClosed className="w-8 h-8 text-gray-500" />
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-transparent outline-none bg w-full text-gray-800"
              />
            </div>
            <div className="w-full flex items-center gap-5 bg-[#E8F0FE] px-5 py-2 rounded-md">
              <HiLockClosed className="w-8 h-8 text-gray-500" />
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-transparent outline-none bg w-full text-gray-800"
              />
            </div>
            <button
              onClick={handleResetPassword}
              className="bg-blue-800 px-8 py-2 rounded-full cursor-pointer text-white"
            >
              {loading ? (
                <span className="flex items-center">
                  <LuLoader className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                  Resetting...
                </span>
              ) : (
                "Reset Password"
              )}
            </button>
          </>
        );
    }
  };

  return (
    <div className="w-full h-screen relative bg-gradient-to-br from-sky-300 to-sky-500">
      <div className="absolute top-0 left-0 h-[80%] w-[80%] -rotate-12 overflow-hidden">
        <img
          src={leftImage}
          alt="leftImage"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute top-40 right-20 w-80 bg-white p-2 rounded-lg">
        {action === "Login" ? null : (
          <FaAngleLeft
            className="w-6 h-6 cursor-pointer bg-blue-800 text-white rounded-full"
            onClick={() => {
              setAction("Login");
              setResetStep(1);
            }}
          />
        )}
        <div className="w-full h-full flex flex-col items-center justify-between gap-10 py-5">
          <h1 className="text-2xl font-bold text-blue-800 underline">
            {action === "Login" ? "Login" : "Reset Password"}
          </h1>
          {action === "Login" ? (
            <form
              onSubmit={handleLogin}
              className="w-full flex flex-col items-center justify-center gap-5 px-3"
            >
              <div className="w-full flex items-center gap-5 bg-[#E8F0FE] px-5 py-2 rounded-md">
                <MdOutlineEmail className="w-8 h-8 text-gray-500" />
                <input
                  type="email"
                  placeholder="User email"
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="bg-transparent outline-none bg w-full text-gray-800"
                />
              </div>
              <div className="w-full flex items-center gap-5 bg-[#E8F0FE] px-5 py-2 rounded-md">
                <HiLockClosed className="w-8 h-8 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent outline-none w-full text-gray-800"
                />
                {password.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-500 focus:outline-none"
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5"
                      >
                        <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                        <path
                          fillRule="evenodd"
                          d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5"
                      >
                        <path d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM22.676 12.553a11.249 11.249 0 01-2.631 4.31l-3.099-3.099a5.25 5.25 0 00-6.71-6.71L7.759 4.577a11.217 11.217 0 014.242-.827c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113z" />
                        <path d="M15.75 12c0 .18-.013.357-.037.53l-4.244-4.243A3.75 3.75 0 0115.75 12zM12.53 15.713l-4.243-4.244a3.75 3.75 0 004.243 4.243z" />
                        <path d="M6.75 12c0-.619.107-1.213.304-1.764l-3.1-3.1a11.25 11.25 0 00-2.63 4.31c-.12.362-.12.752 0 1.114 1.489 4.467 5.704 7.69 10.675 7.69 1.5 0 2.933-.294 4.242-.827l-2.477-2.477A5.25 5.25 0 016.75 12z" />
                      </svg>
                    )}
                  </button>
                )}
              </div>

              <div className="text-[#797979] text-sm">
                Forgot Password?{" "}
                <span
                  onClick={() => {
                    setAction("Forget Password");
                  }}
                  className="text-blue-800 cursor-pointer"
                >
                  Click here!
                </span>
              </div>
              <button
                type="submit"
                className="bg-blue-800 px-8 py-2 rounded-full cursor-pointer text-white"
              >
                {loading ? (
                  <span className="flex items-center">
                    <LuLoader className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                    Login...
                  </span>
                ) : (
                  "Login"
                )}
              </button>
            </form>
          ) : (
            <div className="w-full flex flex-col items-center justify-center gap-5 px-3">
              {renderForgetPasswordContent()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
