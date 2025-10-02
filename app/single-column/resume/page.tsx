import SingleColumnResumePageClient from "./client";

interface SingleColumnResumePageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function SingleColumnResumePage({
  searchParams,
}: SingleColumnResumePageProps) {
  return <SingleColumnResumePageClient searchParams={searchParams} />;
}
