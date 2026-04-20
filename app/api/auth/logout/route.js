import { logoutUser } from "../../../../lib/session";

export async function POST() {
  await logoutUser();
  return Response.json({ success: true });
}
