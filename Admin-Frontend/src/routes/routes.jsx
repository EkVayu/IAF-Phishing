import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import DashboardLayout from "../Layout/DashboardLayout";
import NotFound from "../pages/NotFound";
import Login from "../pages/Login";
import Plugin from "../pages/Plugin";
import PhishingMails from "../pages/PhishingMails";
import SandBox from "../pages/SandBox";
import Quarantine from "../pages/Quarantine";
import RogueDB from "../pages/RogueDB";
import CDR from "../pages/CDR";
import Sirts from "../pages/Sirts";
import Profile from "../pages/Profile";
import Settings from "../pages/Settings";
import Editprofile from "../pages/Editprofile";
import Users from "../pages/SuperAdmin/Users";
import Licenses from "../pages/SuperAdmin/Licenses";
import Reports from "../pages/Reports";
import Contact from "../pages/Contact";
import SuperAdminDashboard from "../pages/SuperAdmin/SuperAdminDashboard";
import StaffDashboard from "../pages/StaffDashboard";
import { useAuth } from "../context/AuthContext";
import PluginActivityPopup from "../components/popup/plugin_activity_popup/PluginActivityPopup";

const ConditionalPluginPopup = () => {
  const [showNotification, setShowNotification] = useState(true);
  const location = useLocation();
  const { role } = useAuth();
  if (location.pathname === "/login" || role === "superuser") {
    return null;
  }
  return (
    <>
      {showNotification && (
        <PluginActivityPopup onClose={() => setShowNotification(false)} />
      )}
    </>
  );
};

const AppRoutes = () => {
  const { role } = useAuth();
  // const role = "superuser";
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        {role === "superuser" ? (
          <>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <SuperAdminDashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    {" "}
                    <SuperAdminDashboard />{" "}
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    {" "}
                    <Users />{" "}
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/licenses"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    {" "}
                    <Licenses />{" "}
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
          </>
        ) : (
          <>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <StaffDashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    {" "}
                    <StaffDashboard />{" "}
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/plugin"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Plugin />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/phishing-mails"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <PhishingMails />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sandbox"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    {" "}
                    <SandBox />{" "}
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/quarantine"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    {" "}
                    <Quarantine />{" "}
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sirts"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    {" "}
                    <Sirts />{" "}
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/rogue-db"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    {" "}
                    <RogueDB />{" "}
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cdr"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    {" "}
                    <CDR />{" "}
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/contact"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    {" "}
                    <Contact />{" "}
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    {" "}
                    <Reports />{" "}
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    {" "}
                    <Profile />{" "}
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit-profile"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    {" "}
                    <Editprofile />{" "}
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    {" "}
                    <Settings />{" "}
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
          </>
        )}

        <Route path="*" element={<NotFound />} />
      </Routes>
      <ConditionalPluginPopup />
    </Router>
  );
};

export default AppRoutes;
