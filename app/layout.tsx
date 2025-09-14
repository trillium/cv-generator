import type { Metadata } from "next";
import "./globals.css";
import Navigation from "../src/components/Navigation/Navigation";
import { ResumeProvider } from "../src/contexts/ResumeContext";
import { ModalProvider } from "../src/contexts/ModalContext";
import Modal from "../src/components/ui/modal";

export const metadata: Metadata = {
  title: "CV Generator",
  description: "Generate professional resumes and cover letters",
};

export default function RootLayout({
  children,
  searchParams,
}: {
  children: React.ReactNode;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <html lang="en">
      <body>
        <ResumeProvider>
          <ModalProvider>
            <Navigation />
            <div className="m-6 print:m-0">
              <main className="resume-content">{children}</main>
            </div>
            <Modal />
          </ModalProvider>
        </ResumeProvider>
      </body>
    </html>
  );
}
