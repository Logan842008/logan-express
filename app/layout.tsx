import "@/styles/globals.css";
import { Metadata } from "next";
import clsx from "clsx";
import { Poppins } from "next/font/google";
import { Providers } from "./providers";
import { siteConfig } from "@/config/site";
import { ThemeWrapper } from "@/components/ThemeWrapper";
import { ToastProvider } from "@/components/ToastContext";
import ClientLayout from "./client-layout";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.ico",
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
      <body
        className={clsx(
          "min-h-screen overflow-hidden bg-background",
          poppins.className
        )}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "warning" }}>
          <ClientLayout>
            <ToastProvider>
              <ThemeWrapper>
                <div className="relative flex flex-col h-screen">
                  {" "}
                  {/* Wrap everything with CarProvider */}
                  {/* Wrap the content with ClientLayout */}
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
