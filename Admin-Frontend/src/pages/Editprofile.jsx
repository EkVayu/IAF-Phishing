import React, { useEffect, useState } from "react";
import { editUserProfile, fetchCurrentUserData } from "../Api/api";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { LuLoader } from "react-icons/lu";
import { useAuth } from "../context/AuthContext";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaBuilding,
  FaCamera,
} from "react-icons/fa";

function EditProfile() {
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState({});
  const { user } = useAuth();
  const navigate = useNavigate();
  const [avatar, setAvatar] = useState(null);

  const [formData, setFormData] = useState({
    email: "",
    username: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    address: "",
    organization: "",
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (user && userInfo) {
      setFormData({
        email: userInfo.email || "",
        username: user.username || "",
        first_name: userInfo.first_name || "",
        last_name: userInfo.last_name || "",
        phone_number: userInfo.phone_number || "",
        address: userInfo.address || "",
        organization: userInfo.organization || "",
      });
      setAvatar(userInfo.avatar || null);
    }
  }, [user, userInfo]);

  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      const response = await fetchCurrentUserData();
      if (response.ok) {
        const data = await response.json();
        setUserInfo(data);
      } else {
        toast.warn("No user data found! Update your profile");
      }
    } catch (error) {
      toast.error("Error fetching user data: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (formData.email !== user.email || formData.username !== user.username) {
      toast.error("Email and Username cannot be changed.");
      setIsLoading(false);
      return;
    }

    if (!validateEmail(formData.email)) {
      toast.error("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    try {
      const updatedFormData = { ...formData, avatar };
      const response = await editUserProfile(updatedFormData);

      if (response.ok) {
        const updatedUser = await response.json();
        setUserInfo(updatedUser);
        setIsLoading(false);
        toast.success("Profile updated successfully!");
        navigate("/profile");
      } else {
        setIsLoading(false);
        toast.error("Failed to update profile. Please try again.");
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Error updating profile:", error);
      toast.error("An error occurred while updating the profile.");
    }
  };

  const inputFields = [
    { key: "username", icon: <FaUser />, type: "text" },
    { key: "email", icon: <FaEnvelope />, type: "email" },
    { key: "first_name", icon: <FaUser />, type: "text" },
    { key: "last_name", icon: <FaUser />, type: "text" },
    { key: "phone_number", icon: <FaPhone />, type: "tel" },
    { key: "address", icon: <FaMapMarkerAlt />, type: "text" },
    { key: "organization", icon: <FaBuilding />, type: "text" },
  ];

  return (
    <div className="min-h-screen">
      <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="bg-primary dark:bg-gray-900 h-20 px-5 flex items-center">
          <h2 className="text-3xl font-bold text-white tracking-widest">
            Edit Profile
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-8">
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <img
                src={avatar || "https://via.placeholder.com/150"}
                alt="Avatar"
                className="w-32 h-32 rounded-full object-cover"
              />
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 bg-background rounded-full p-2 cursor-pointer shadow-md"
              >
                <FaCamera className="text-gray-600 dark:text-white" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {inputFields.map(({ key, icon, type }) => (
              <div key={key} className="relative">
                <label
                  htmlFor={key}
                  className="text-sm font-medium text-gray-700 dark:text-white mb-1 block"
                >
                  {key.replace("_", " ").charAt(0).toUpperCase() +
                    key.slice(1).replace("_", " ")}
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">{icon}</span>
                  </div>
                  <input
                    type={type}
                    name={key}
                    id={key}
                    required
                    value={formData[key]}
                    onChange={handleInputChange}
                    placeholder={`Enter ${key}`}
                    className={`block w-full text-secondary-foreground pl-10 sm:text-sm border h-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      key === "email" || key === "username"
                        ? "bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                        : "dark:bg-gray-700"
                    }`}
                    readOnly={key === "email" || key === "username"}
                  />
                </div>
                {(key === "email" || key === "username") && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-white tracking-wider">
                    This field cannot be edited
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-end space-x-4">
            <Link to="/profile">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-white dark:hover:bg-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <LuLoader className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                  Updating...
                </span>
              ) : (
                "Update Profile"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfile;
