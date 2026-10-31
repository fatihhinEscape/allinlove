import type { Metadata, Viewport } from "next";
import { Fraunces, Nunito } from "next/font/google";
import { Providers } from "@/components/providers";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin", "latin-ext"],
  variable: "--font-nunito",
});

const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: "allinlove",
  description: "İkinizin ortak yeri",
  applicationName: "allinlove",
  appleWebApp: {
    capable: true,
    title: "allinlove",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#c45c6a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      suppressHydrationWarning
      className={`${nunito.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <PwaRegister />
          {children}
        </Providers>
      </body>
    </html>
  );
}
