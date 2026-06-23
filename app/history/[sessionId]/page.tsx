import { redirect } from "next/navigation";

export default async function HistorySessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  redirect(`/interview/${sessionId}/analysis`);
}
