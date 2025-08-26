import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EchoScribe",
  description: "Record your voice and turn it into text, fast.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-100 text-gray-900 antialiased">
        <div className="mx-auto max-w-3xl p-6">
          <header className="mb-6">
            <h1 className="text-3xl font-bold">🎤 EchoScribe</h1>
            <p className="text-gray-600">Record → Upload → Transcribe</p>
          </header>
          {children}
          <footer className="mt-12 text-xs text-gray-500">
            Built with Next.js & Tailwind CSS
          </footer>
        </div>
      </body>
    </html>
  );
}
