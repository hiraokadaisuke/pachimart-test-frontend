import { handleGetMessages, handlePostMessage } from "@/lib/messages/server";

export async function GET(request: Request, props: { params: Promise<{ naviId: string }> }) {
  const params = await props.params;
  return handleGetMessages(request, params.naviId);
}

export async function POST(request: Request, props: { params: Promise<{ naviId: string }> }) {
  const params = await props.params;
  return handlePostMessage(request, params.naviId);
}
