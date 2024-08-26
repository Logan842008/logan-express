"use client";
import { createContext, useContext, ReactNode } from "react";
import { ToastContainer, toast, ToastOptions, Id } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Poppins } from "next/font/google"; // Import the Poppins font

const poppins = Poppins({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

type ToastContextType = {
  showToast: (message: string, options?: ToastOptions) => Id;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const showToast = (message: string, options?: ToastOptions): Id => {
    return toast(message, options);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {/* Add the custom className for styling */}
      <ToastContainer position="bottom-right" className={poppins.className} />
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
