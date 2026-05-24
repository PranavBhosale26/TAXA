import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TAXA AI | The Sovereign Intelligent Studio & Data Workspace",
  description: "TAXA AI is a high-end, secure, local-first artificial intelligence assistant and chat companion powered by Gemini 2.5 Flash and Next.js.",
  verification: {
    google: "cec4c77793531f89",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased dark`}
    >
      <body className="flex flex-col min-h-screen">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Disable right-click context menu
              document.addEventListener('contextmenu', function(e) {
                e.preventDefault();
              });

              // Disable standard developer panel keyboard shortcuts
              document.addEventListener('keydown', function(e) {
                // Block F12
                if (e.key === 'F12') {
                  e.preventDefault();
                }
                // Block Ctrl+Shift+I / Cmd+Opt+I (Inspect Element)
                if ((e.ctrlKey || e.metaKey || e.altKey) && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'c' || e.key === 'C')) {
                  e.preventDefault();
                }
                // Block Ctrl+Shift+J / Cmd+Opt+J (Console Panel)
                if ((e.ctrlKey || e.metaKey || e.altKey) && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
                  e.preventDefault();
                }
                // Block Ctrl+U / Cmd+U (View Source Code)
                if ((e.ctrlKey || e.metaKey) && (e.key === 'U' || e.key === 'u')) {
                  e.preventDefault();
                }
              });
            `
          }}
        />
      </body>
    </html>
  );
}
