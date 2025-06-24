import { createFileRoute } from "@tanstack/react-router";
import type { CVData } from "../types";
import scriptData from "../script-data.json";
import fallbackData from "../data.json";
import TwoColumnResume from "../components/Resume/two-column/resume";
import SingleColumnResume from "../components/Resume/single-column/resume";

export const Route = createFileRoute("/$resumeType/resume")({
  component: ResumeRoute,
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
  9;
}

const defaultData: CVData = mergeData(fallbackData, scriptData);

export const resumeComponentMap: Record<
  string,
  React.ComponentType<{ data: CVData }>
> = {
  "two-column": TwoColumnResume,
  "single-column": SingleColumnResume,
  // Add more mappings here as needed
};

export function ResumeRoute() {
  // Use params from props or from Route.useParams()
  const routeParams = Route.useParams();
  const resumeType = routeParams.resumeType;
  const data = defaultData;

  if (resumeType) return <Resume resumeType={resumeType} data={data} />;
  if (!resumeType) {
    return (
      <>
        <div>Missing resumeType param</div>
        <div>routeParams: {JSON.stringify(routeParams)}</div>
      </>
    );
  }
}

function Resume({ resumeType, data }: { resumeType: string; data?: CVData }) {
  const useData = data || defaultData;
  const ResumeComponent = resumeComponentMap[resumeType];
  if (ResumeComponent) {
    return <ResumeComponent data={useData} />;
  }
  return <div>Unknown resume type: {resumeType}</div>;
}
