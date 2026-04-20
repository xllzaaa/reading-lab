import { changePassword, isUnauthorizedError, unauthorizedResponse } from "../../../../lib/session";

export async function PUT(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = await changePassword(body);

    if (result.error) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    return Response.json(result);
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return unauthorizedResponse();
    }
    throw error;
  }
}
