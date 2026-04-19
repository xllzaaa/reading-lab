import { getDiscussionKit } from "../../../lib/readingStore";

export async function GET(request) {
  const bookId = Number(request.nextUrl.searchParams.get("bookId") || 0);
  const kit = getDiscussionKit(bookId);

  if (!kit) {
    return Response.json({ error: "暂无可讨论的书籍" }, { status: 404 });
  }

  return Response.json({ kit });
}
