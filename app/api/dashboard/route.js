import { getDashboard } from "../../../lib/readingStore";
import { getCurrentUserId } from "../../../lib/session";

export async function GET() {
  const userId = await getCurrentUserId();
  return Response.json(await getDashboard(userId));
}
