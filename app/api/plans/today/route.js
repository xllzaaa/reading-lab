import { getTodayPlan } from "../../../../lib/readingStore";
import { getCurrentUserId } from "../../../../lib/session";
import { listTodos } from "../../../../lib/todoStore";

export async function GET() {
  const userId = await getCurrentUserId();
  return Response.json(await getTodayPlan(await listTodos(userId), userId));
}
