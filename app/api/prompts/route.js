import { getPrompts } from "../../../lib/readingStore";
import { getCurrentUserId } from "../../../lib/session";

export async function GET(request) {
  const userId = await getCurrentUserId();
  const bookId = Number(request.nextUrl.searchParams.get("bookId") || 0);
  return Response.json({ prompts: await getPrompts(bookId, userId) });
}
