import { getDefaultData } from "../../../lib/data";
import TwoColumnCoverLetter from "../../../src/components/Resume/two-column/cover-letter";

export default function TwoColumnCoverLetterPage() {
  const data = getDefaultData();
  return <TwoColumnCoverLetter data={data} />;
}
