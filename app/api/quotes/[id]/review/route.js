import { reviewQuote } from "../../../../../lib/readingStore";
import { getCurrentUserId } from "../../../../../lib/session";

function toId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function POST(request, { params }) {
  const { id: rawId } = await params;
  const id = toId(rawId);
  if (!id) {
    return Response.json({ error: "无效的摘录编号" }, { status: 400 });
  }

  const userId = await getCurrentUserId();
  const body = await request.json().catch(() => ({}));
  const result = await reviewQuote(id, Boolean(body.remembered), userId);

  if (result.error) {
    return Response.json({ error: result.error }, { status: 404 });
  }

  return Response.json(result);
}
