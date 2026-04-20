import { NextResponse } from "next/server";

const PUBLIC_API_PREFIXES = ["/api/auth", "/api/recommendations"];

export default function proxy(request) {
  const { pathname } = request.nextUrl;
  const isPublicApi = PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (pathname.startsWith("/api") && !isPublicApi && !request.cookies.get("reading_lab_session")) {
    return NextResponse.json({ error: "请先登录后再使用个人阅读工作台" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
