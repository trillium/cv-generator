import TwoColumnResumePageClient from "./client";

interface TwoColumnResumePageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function TwoColumnResumePage({
  searchParams,
}: TwoColumnResumePageProps) {
  return <TwoColumnResumePageClient searchParams={searchParams} />;
}
