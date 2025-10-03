import SingleColumnResumePageClient from "./client";

interface SingleColumnResumePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SingleColumnResumePage({
  searchParams,
}: SingleColumnResumePageProps) {
  const params = await searchParams;
  return <SingleColumnResumePageClient searchParams={params} />;
}
