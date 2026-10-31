import type { Metadata } from "next";
import { Fraunces, Nunito } from "next/font/google";
import { Providers } from "@/components/providers";
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
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      suppressHydrationWarning
      className={`${nunito.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
