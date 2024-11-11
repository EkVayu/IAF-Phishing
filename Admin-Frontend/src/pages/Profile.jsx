import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaEdit,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaBuilding,
  FaCalendar,
  FaBriefcase,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { fetchCurrentUserData } from "../Api/api";
import LoaderComponent from "../components/Common/LoaderComponent";

function Profile() {
  const { user, role } = useAuth();
  const [userInfo, setUserInfo] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const response = await fetchCurrentUserData();
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setUserInfo(data[0]);
        } else {
          toast.warn("No user data found");
        }
      } else {
        toast.warn("No user data found! Update your profile");
      }
    } catch (error) {
      toast.error("Error fetching user data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // if (loading) {
  //   return (
  //     <div className="flex justify-center items-center h-[80vh] bg-white dark:bg-gray-800 rounded-md">
  //       <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary dark:border-white"></div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-[80vh]">
      <div className="w-full">
        <h1 className="text-3xl font-semibold text-secondary-foreground tracking-widest">
          Profile
        </h1>

        {loading ? (
          <LoaderComponent />
        ) : (
          <div className="">
            <div className="bg-background dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mt-5">
              <div className="bg-primary dark:bg-gray-900 h-20 px-5 py-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2 capitalize tracking-widest">
                      {user?.username || "User Name"}
                    </h2>
                    <p className="text-white capitalize text-sm">
                      {role || "User Role"}
                    </p>
                  </div>
                  <Link
                    to="/profile/edit"
                    className="bg-background text-primary dark:text-white transition duration-300 py-2 px-4 rounded-full flex items-center"
                  >
                    <FaEdit className="w-5 h-5 mr-2" />
                    Edit Profile
                  </Link>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <ProfileItem
                    icon={<FaUser />}
                    label="First Name"
                    value={user?.name}
                  />
                  <ProfileItem
                    icon={<FaUser />}
                    label="Last Name"
                    value={user?.name}
                  />
                  <ProfileItem
                    icon={<FaEnvelope />}
                    label="Email"
                    value={user?.email}
                  />
                  <ProfileItem
                    icon={<FaPhone />}
                    label="Phone"
                    value={userInfo?.phone_number}
                  />
                  <ProfileItem
                    icon={<FaMapMarkerAlt />}
                    label="Address"
                    value={userInfo?.address}
                  />
                  <ProfileItem
                    icon={<FaBuilding />}
                    label="Organization"
                    value={userInfo?.organization}
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <ActivitySection />
              <StatsSection />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileItem({ icon, label, value }) {
  return (
    <div className="flex items-center p-4 bg-gray-50 dark:bg-transparent rounded-md dark:shadow-sm dark:shadow-white transition duration-300 hover:bg-gray-200 dark:hover:bg-gray-800">
      <div className="text-primary mr-4">{icon}</div>
      <div>
        <p className="text-sm text-gray-600 dark:text-white">{label}</p>
        <p className="font-semibold text-gray-800 dark:text-white">
          {value || "Not provided"}
        </p>
      </div>
    </div>
  );
}

function ActivitySection() {
  return (
    <div className="bg-background dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold mb-4 text-secondary-foreground">
        Recent Activity
      </h3>
      <ul className="space-y-3">
        <li className="flex items-center text-sm text-secondary-foreground">
          <span className="w-4 h-4 rounded-full bg-green-500 mr-2"></span>
          Logged in from new device
        </li>
        <li className="flex items-center text-sm text-secondary-foreground">
          <span className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></span>
          Updated profile information
        </li>
        <li className="flex items-center text-sm text-secondary-foreground">
          <span className="w-4 h-4 rounded-full bg-red-500 mr-2"></span>
          Changed password
        </li>
      </ul>
    </div>
  );
}

function StatsSection() {
  return (
    <div className="bg-background dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold mb-4 text-secondary-foreground">
        Account Statistics
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center text-secondary-foreground">
          <p className="text-3xl font-bold text-blue-500">25</p>
          <p className="text-sm text-gray-600 dark:text-white">Total Logins</p>
        </div>
        <div className="text-center text-secondary-foreground">
          <p className="text-3xl font-bold text-green-500">98%</p>
          <p className="text-sm text-gray-600 dark:text-white">
            Profile Completion
          </p>
        </div>
      </div>
    </div>
  );
}

export default Profile;
