import { getDefaultData } from "../../../lib/data";
import SingleColumnCoverLetter from "../../../src/components/Resume/single-column/cover-letter";

export default function SingleColumnCoverLetterPage() {
  const data = getDefaultData();
  return <SingleColumnCoverLetter data={data} />;
}
