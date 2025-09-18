import type { Metadata } from "next";
import "./globals.css";
import Navigation from "../src/components/Navigation/Navigation";
import { ResumeProvider } from "../src/contexts/ResumeContext";
import { ModalProvider } from "../src/contexts/ModalContext";
import Modal from "../src/components/ui/modal";
import { ThemeProviders } from "./theme-providers";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "CV Generator",
  description: "Generate professional resumes and cover letters",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
  searchParams,
}: {
  children: React.ReactNode;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className="bg-white dark:bg-gray-800 min-w-2xl">
        <ThemeProviders>
          <ResumeProvider>
            <ModalProvider>
              <Navigation />
              <div className="m-6 print:m-0">
                <main className="resume-content">{children}</main>
              </div>
              <Modal />
              <Toaster />
            </ModalProvider>
          </ResumeProvider>
        </ThemeProviders>
      </body>
    </html>
  );
}
