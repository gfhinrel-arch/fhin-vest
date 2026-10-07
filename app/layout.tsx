import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Nav } from "./nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fhin VEST",
  description: "Alat bantu riset data saham IDX. Bukan nasihat keuangan.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={geistSans.variable}>
      <body className="grain">
        <Nav />
        {children}
      </body>
    </html>
  );
}
