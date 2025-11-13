import { Outfit, Lora } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ['400', '600', '700']
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ['400', '600']
});

export const metadata = {
  title: "Purrfect Love",
  description: "Cat adoption and rehab collective based in Bangalore and Stuttgart",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${lora.variable}`}>
        {children}
      </body>
    </html>
  );
}