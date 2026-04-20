import { loginUser } from "../../../../lib/session";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const result = await loginUser(body);

  if (result.error) {
    return Response.json({ error: result.error }, { status: 401 });
  }

  return Response.json(result);
}
