import { FileManagerProvider } from "@/contexts/FileManagerContext";
import FileManagerFeature from "@/features/fileManager/FileManagerFeature";

export default function FileManagerPage() {
  return (
    <FileManagerProvider>
      <FileManagerFeature />
    </FileManagerProvider>
  );
}
