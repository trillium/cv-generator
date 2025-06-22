import { createFileRoute } from "@tanstack/react-router";
import type { CVData } from "../types";
import scriptData from "../script-data.json";
import fallbackData from "../data.json";
import TwoColumnCoverLetter from "../components/Resume/two-column/cover-letter";
import SingleColumnCoverLetter from "../components/Resume/single-column/cover-letter";

export const Route = createFileRoute("/$resumeType/cover-letter")({
  component: CoverLetterRoute,
});

function mergeData(fallback: any, script: any): CVData {
  // Ensure header has omitTitle and omitBlurb
  const mergedHeader = {
    ...fallback.header,
    ...script.header,
    omitTitle: script.header?.omitTitle ?? fallback.header?.omitTitle ?? false,
    omitBlurb: script.header?.omitBlurb ?? fallback.header?.omitBlurb ?? false,
  };
  return {
    ...fallback,
    ...script,
    header: mergedHeader,
  };
}

const defaultData: CVData = mergeData(fallbackData, scriptData);

export const coverLetterComponentMap: Record<
  string,
  React.ComponentType<{ data: CVData }>
> = {
  "two-column": TwoColumnCoverLetter,
  "single-column": SingleColumnCoverLetter,
  // Add more mappings here as needed
};

export function CoverLetterRoute({
  params,
  data,
}: {
  params?: { resumeType?: string };
  data?: CVData;
}) {
  // Use params from props or from Route.useParams()
  const routeParams = Route.useParams();
  const resumeType = params?.resumeType || routeParams.resumeType;

  if (resumeType) return <CoverLetter resumeType={resumeType} data={data} />;
  if (!resumeType) {
    return (
      <>
        <div>Missing resumeType param</div>
        <div>
          params: {JSON.stringify(params)}
          <br />
          routeParams: {JSON.stringify(routeParams)}
        </div>
      </>
    );
  }
}

function CoverLetter({
  resumeType,
  data,
}: {
  resumeType: string;
  data?: CVData;
}) {
  const useData = data || defaultData;
  const CoverLetterComponent = coverLetterComponentMap[resumeType];
  if (CoverLetterComponent) {
    return <CoverLetterComponent data={useData} />;
  }
  return <div>Unknown resume type: {resumeType}</div>;
}

export function CoverLetterTypeList() {
  return (
    <ul>
      {Object.keys(coverLetterComponentMap).map((key) => (
        <li key={key}>{key}</li>
      ))}
    </ul>
  );
}
