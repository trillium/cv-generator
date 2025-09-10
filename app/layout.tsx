import type { Metadata } from "next";
import "./globals.css";
import Navigation from "../src/components/Navigation/Navigation";
import { getYamlData } from "../lib/getYamlData";
import { YamlDataProvider } from "../src/contexts/YamlDataContext";

export const metadata: Metadata = {
  title: "CV Generator",
  description: "Generate professional resumes and cover letters",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialYamlContent = getYamlData();

  return (
    <html lang="en">
      <body>
        <YamlDataProvider initialYamlContent={initialYamlContent}>
          <Navigation />
          <div className="m-6 print:m-0">
            <main className="resume-content">{children}</main>
          </div>
        </YamlDataProvider>
      </body>
    </html>
  );
}
