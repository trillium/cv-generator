import TwoColumnResumePageClient from "./client";

interface TwoColumnResumePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function TwoColumnResumePage({
  searchParams,
}: TwoColumnResumePageProps) {
  const params = await searchParams;
  return <TwoColumnResumePageClient searchParams={params} />;
}
