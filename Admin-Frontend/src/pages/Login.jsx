import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import leftImage from "../assets/loginPlane.png";
import { useAuth } from "../context/AuthContext";
import { loginApi, sendPasswordResetOtp } from "../Api/api";
import { MdOutlineEmail } from "react-icons/md";
import { HiLockClosed } from "react-icons/hi";
import { FaAngleLeft } from "react-icons/fa";
import { toast } from "react-toastify";
import { LuLoader } from "react-icons/lu";
import { validatePassword } from "../Validation";

function Login() {
  const [action, setAction] = useState("Login");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password;
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

    if (!validatePassword(password)) {
      toast.error(
        "Password must be at least 8 characters long and contain at least one special character."
      );
      return;
    }

    try {
      setLoading(true);
      const response = await loginApi({ email: userId, password });
      if (response.ok) {
        const data = await response.json();
        login(data.token, data.user, data.role);
        setLoading(false);
        toast.success("Login successful!");
        navigate("/dashboard");
      } else {
        toast.error("Invalid user ID or password");
        setLoading(false);
      }
    } catch (error) {
      toast.error("Error logging in: " + error.message);
      setLoading(false);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!validateEmail(userId)) {
      toast.error("Please enter a valid email address.");
      return;
    } else {
      setLoading(true);
      try {
        const response = await sendPasswordResetOtp(userId);
        const data = await response.json();
        if (data.success) {
          toast.success("Password reset link sent to your email");
          setLoading(false);
        } else {
          toast.error("Failed to send password reset link");
          setLoading(false);
        }
        setAction("Login");
      } catch (error) {
        toast.error("Error sending password reset link: " + error.message);
        setLoading(false);
      }
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
      <div className="absolute top-40 right-20 h-96 w-80 bg-white p-2 rounded-lg">
        {action === "Login" ? null : (
          <FaAngleLeft
            className="w-6 h-6 cursor-pointer bg-blue-800 text-white rounded-full"
            onClick={() => {
              setAction("Login");
            }}
          />
        )}
        <div className="w-full h-full flex flex-col items-center justify-between py-5">
          <h1 className="text-2xl font-bold text-blue-800 underline">
            {action === "Login" ? "Login" : "Forget Password"}
          </h1>
          <form
            onSubmit={handleLogin}
            className="w-full flex flex-col items-center justify-center gap-5 px-3"
          >
            <div className="w-full flex items-center gap-10 bg-[#E8F0FE] px-5 py-2 rounded-md">
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
            {action === "Forget Password" ? null : (
              <div className="w-full flex items-center gap-10 bg-[#E8F0FE] px-5 py-2 rounded-md">
                <HiLockClosed className="w-8 h-8 text-gray-500" />
                <input
                  type="password"
                  placeholder="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent outline-none w-full text-gray-800"
                />
              </div>
            )}
            {action === "Forget Password" ? null : (
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
            )}
            <div className="w-full flex items-center justify-center">
              {action === "Forget Password" ? (
                <div
                  className="bg-blue-800 px-8 py-2 rounded-full cursor-pointer text-white mb-10 select-none"
                  onClick={handleSendPasswordReset}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <LuLoader className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                      Sending...
                    </span>
                  ) : (
                    <span className="text-sm">Send OTP</span>
                  )}
                </div>
              ) : (
                <button
                  type="submit"
                  className="bg-blue-800 px-8 py-2 rounded-full cursor-pointer text-white select-none"
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
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
