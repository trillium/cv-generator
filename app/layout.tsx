import "./globals.css";
import Navigation from "@/components/Navigation/Navigation";
import { DirectoryManagerProvider } from "@/contexts/DirectoryManagerContext";
import { FileManagerProvider } from "@/contexts/FileManagerContext";
import { ModalProvider } from "@/contexts/ModalContext";
import Modal from "@/components/ui/modal";
import { ThemeProviders } from "./theme-providers";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className="bg-white dark:bg-gray-800 min-w-2xl">
        <ThemeProviders>
          <DirectoryManagerProvider>
            <FileManagerProvider>
              <ModalProvider>
                <Navigation />
                <div className="m-6 print:m-0">
                  <main className="resume-content">{children}</main>
                </div>
                <Modal />
                <Toaster />
              </ModalProvider>
            </FileManagerProvider>
          </DirectoryManagerProvider>
        </ThemeProviders>
      </body>
    </html>
  );
}
