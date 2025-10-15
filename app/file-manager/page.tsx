import { FileManagerProvider } from "../../src/contexts/FileManagerContext";
import FileManagerFeature from "./FileManagerFeature";

export default function FileManagerPage() {
  return (
    <FileManagerProvider>
      <FileManagerFeature />
    </FileManagerProvider>
  );
}
