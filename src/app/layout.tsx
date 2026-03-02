import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans } from "next/font/google";
import GoogleProvider from "@/components/providers/GoogleProvider";
import { AuthProvider } from "@/components/auth/AuthContext";
import Shell from "@/components/layout/Shell";
import { Toaster } from "sonner";
import "./globals.css";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm",
});

export const metadata: Metadata = {
  title: "GHOSTBOND Portal",
  description: "Action Engine Internal Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bebas.variable} ${dmSans.variable}`}>
      <body className="antialiased flex h-screen overflow-hidden">
        <GoogleProvider>
          <AuthProvider>
            <Shell>
              {children}
            </Shell>
          </AuthProvider>
        </GoogleProvider>
        <Toaster theme="dark" position="bottom-right" className="font-dm" />
      </body>
    </html>
  );
}
