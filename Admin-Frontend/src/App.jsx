import { useState, useEffect } from "react";
import { ThemeProvider } from "@/context/theme-provider";
import AppRoutes from "./routes/routes";
import { AuthProvider } from "./context/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        {isLoading ? (
          <div className="flex items-center justify-center h-screen bg-background">
            <iframe
              src="https://lottie.host/embed/bf1bf197-1471-4f03-abec-5adc2700b0b3/lJeTuvAtWQ.json"
              className="rounded-lg w-52 h-52"
            ></iframe>
          </div>
        ) : (
          <>
            <AppRoutes />
            <ToastContainer
              position="top-right"
              autoClose={2000}
              hideProgressBar
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="dark"
              transition:Bounce
            />
          </>
        )}
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
