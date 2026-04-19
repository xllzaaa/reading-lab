import { getDiscussionKit } from "../../../lib/readingStore";
import { getCurrentUserId } from "../../../lib/session";

export async function GET(request) {
  const userId = await getCurrentUserId();
  const bookId = Number(request.nextUrl.searchParams.get("bookId") || 0);
  const kit = await getDiscussionKit(bookId, userId);

  if (!kit) {
    return Response.json({ error: "暂无可讨论的书籍" }, { status: 404 });
  }

  return Response.json({ kit });
}
