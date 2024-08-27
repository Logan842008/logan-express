import "./styles/globals.css";
import { Metadata } from "next";
import clsx from "clsx";
import { Poppins } from "next/font/google";
import { Providers } from "./providers";
import { ThemeWrapper } from "@/components/ThemeWrapper";
import { ToastProvider } from "@/components/ToastContext";
import ClientLayout from "./client-layout";
import { Navbar } from "@nextui-org/navbar";

export const metadata: Metadata = {
  title: {
    default: "Logan Express",
    template: `Car Selling and Renting Website`,
  },
  description: `Car Selling and Renting Website`,
  icons: {
    icon: "icon.ico",
  },
};

const poppins = Poppins({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body className={`h-screen ${clsx(poppins.className)}`}>
        <Providers themeProps={{ attribute: "class", defaultTheme: "warning" }}>
          <ClientLayout>
            <ToastProvider>
              <ThemeWrapper>
                <div className="h-full">
                  {" "}
                  {/* Ensure full height container */}
                  <main className="container mx-auto max-w-full px-0 flex-grow">
                    {children}
                  </main>
                </div>
              </ThemeWrapper>
            </ToastProvider>
          </ClientLayout>
        </Providers>
      </body>
    </html>
  );
}
