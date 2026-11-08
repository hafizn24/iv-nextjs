import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata = {
  title: "Guard Walk-In System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-gray-50 text-gray-900">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
