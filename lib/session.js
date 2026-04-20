import { cookies } from "next/headers";
import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { ensureSchema, sql } from "./db";

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = "reading_lab_session";
const SESSION_DAYS = 30;
const PASSWORD_KEY_LENGTH = 64;

export class UnauthorizedError extends Error {
  constructor(message = "请先登录后再使用个人阅读工作台") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizeDisplayName(name, email) {
  const text = String(name || "").trim();
  if (text) {
    return text.slice(0, 40);
  }
  return email.split("@")[0] || "阅读者";
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  const text = String(password || "");
  if (text.length < 8) {
    return "密码至少需要 8 位";
  }
  if (!/[A-Za-z]/.test(text) || !/[0-9]/.test(text)) {
    return "密码至少需要包含字母和数字";
  }
  return "";
}

function hashSessionToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString("base64url");
  const key = await scrypt(password, salt, PASSWORD_KEY_LENGTH);
  return `scrypt:${salt}:${key.toString("base64url")}`;
}

async function verifyPassword(password, storedHash) {
  const [scheme, salt, key] = String(storedHash || "").split(":");
  if (scheme !== "scrypt" || !salt || !key) {
    return false;
  }

  const expected = Buffer.from(key, "base64url");
  const actual = await scrypt(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

async function setSessionCookie(token, expiresAt) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

async function createSession(userId) {
  await ensureSchema();
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await sql`
    INSERT INTO user_sessions (token_hash, user_id, expires_at)
    VALUES (${tokenHash}, ${userId}, ${expiresAt.toISOString()})
  `;
  await setSessionCookie(token, expiresAt);
}

export async function registerUser(input) {
  await ensureSchema();
  const email = normalizeEmail(input.email);
  const password = String(input.password || "");
  const passwordError = validatePassword(password);

  if (!validateEmail(email)) {
    return { error: "请填写有效邮箱" };
  }
  if (passwordError) {
    return { error: passwordError };
  }

  const existing = await sql`SELECT id FROM user_accounts WHERE email = ${email}`;
  if (existing.length) {
    return { error: "这个邮箱已经注册，请直接登录" };
  }

  const user = {
    id: randomUUID(),
    email,
    displayName: normalizeDisplayName(input.displayName, email),
    passwordHash: await hashPassword(password),
  };

  await sql`
    INSERT INTO user_accounts (id, email, display_name, password_hash)
    VALUES (${user.id}, ${user.email}, ${user.displayName}, ${user.passwordHash})
  `;
  await createSession(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    },
  };
}

export async function loginUser(input) {
  await ensureSchema();
  const email = normalizeEmail(input.email);
  const password = String(input.password || "");
  const [row] = await sql`
    SELECT id, email, display_name, password_hash
    FROM user_accounts
    WHERE email = ${email}
  `;

  if (!row || !(await verifyPassword(password, row.password_hash))) {
    return { error: "邮箱或密码不正确" };
  }

  await createSession(row.id);
  return {
    user: {
      id: row.id,
      email: row.email,
      displayName: row.display_name,
    },
  };
}

export async function logoutUser() {
  await ensureSchema();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await sql`DELETE FROM user_sessions WHERE token_hash = ${hashSessionToken(token)}`;
  }
  await clearSessionCookie();
}

export async function getCurrentUser() {
  await ensureSchema();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    throw new UnauthorizedError();
  }

  const [row] = await sql`
    SELECT user_accounts.id, user_accounts.email, user_accounts.display_name, user_sessions.expires_at
    FROM user_sessions
    JOIN user_accounts ON user_accounts.id = user_sessions.user_id
    WHERE user_sessions.token_hash = ${hashSessionToken(token)}
    LIMIT 1
  `;

  if (!row || new Date(row.expires_at).getTime() <= Date.now()) {
    if (row) {
      await sql`DELETE FROM user_sessions WHERE token_hash = ${hashSessionToken(token)}`;
    }
    await clearSessionCookie();
    throw new UnauthorizedError();
  }

  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
  };
}

export async function getCurrentUserId() {
  const user = await getCurrentUser();
  return user.id;
}

export async function changePassword(input) {
  const user = await getCurrentUser();
  const currentPassword = String(input.currentPassword || "");
  const nextPassword = String(input.nextPassword || "");
  const passwordError = validatePassword(nextPassword);

  if (passwordError) {
    return { error: passwordError };
  }

  const [row] = await sql`
    SELECT password_hash
    FROM user_accounts
    WHERE id = ${user.id}
  `;

  if (!row || !(await verifyPassword(currentPassword, row.password_hash))) {
    return { error: "当前密码不正确" };
  }

  const nextHash = await hashPassword(nextPassword);
  await sql`
    UPDATE user_accounts
    SET password_hash = ${nextHash}, updated_at = NOW()
    WHERE id = ${user.id}
  `;

  return { success: true };
}

export function unauthorizedResponse() {
  return Response.json({ error: "请先登录后再使用个人阅读工作台" }, { status: 401 });
}

export function isUnauthorizedError(error) {
  return error instanceof UnauthorizedError || error?.message === "UNAUTHORIZED";
}
