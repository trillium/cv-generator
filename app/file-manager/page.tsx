import { FileManagerProvider } from "@/contexts/FileManagerContext";
import FileManagerFeature from "./FileManagerFeature";

export default function FileManagerPage() {
  return (
    <FileManagerProvider>
      <FileManagerFeature />
    </FileManagerProvider>
  );
}
