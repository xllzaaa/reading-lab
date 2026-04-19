import { ensureSchema, sql } from "./db";

const PRIORITY_ORDER = ["高", "中", "低"];

function normalizePriority(value) {
  return PRIORITY_ORDER.includes(value) ? value : "中";
}

function normalizeBookId(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function mapTodo(row) {
  return {
    id: row.id,
    text: row.text,
    done: row.done,
    priority: row.priority,
    bookId: row.book_id,
    createdAt: row.created_at,
  };
}

async function prepareTodos(userId) {
  await ensureSchema();
  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM todos WHERE user_id = ${userId}`;
  if (count > 0) {
    return;
  }

  await sql`
    INSERT INTO todos (user_id, text, done, priority, book_id)
    VALUES
      (${userId}, '给《深度工作》做一次 20 分钟章节复盘', FALSE, '高', NULL),
      (${userId}, '整理本周 3 条可执行摘录', FALSE, '中', NULL)
  `;
}

export async function listTodos(userId = "demo") {
  await prepareTodos(userId);
  const rows = await sql`
    SELECT *
    FROM todos
    WHERE user_id = ${userId}
    ORDER BY
      done ASC,
      CASE priority WHEN '高' THEN 0 WHEN '中' THEN 1 ELSE 2 END ASC,
      created_at DESC
  `;
  return rows.map(mapTodo);
}

export async function getTodo(id, userId = "demo") {
  await prepareTodos(userId);
  const [row] = await sql`SELECT * FROM todos WHERE user_id = ${userId} AND id = ${id}`;
  return row ? mapTodo(row) : null;
}

export async function createTodo(input, userId = "demo") {
  await prepareTodos(userId);
  const text = String(input.text || "").trim();
  const priority = normalizePriority(String(input.priority || "中"));
  const bookId = normalizeBookId(input.bookId);
  const [row] = await sql`
    INSERT INTO todos (user_id, text, done, priority, book_id)
    VALUES (${userId}, ${text}, FALSE, ${priority}, ${bookId})
    RETURNING *
  `;

  return mapTodo(row);
}

export async function updateTodo(id, patch, userId = "demo") {
  const todo = await getTodo(id, userId);
  if (!todo) {
    return null;
  }

  const text = typeof patch.text === "string" ? patch.text : todo.text;
  const done = typeof patch.done === "boolean" ? patch.done : todo.done;
  const priority = typeof patch.priority === "string" ? normalizePriority(patch.priority) : todo.priority;
  const bookId = Object.prototype.hasOwnProperty.call(patch, "bookId") ? normalizeBookId(patch.bookId) : todo.bookId;

  const [row] = await sql`
    UPDATE todos
    SET text = ${text}, done = ${done}, priority = ${priority}, book_id = ${bookId}
    WHERE user_id = ${userId} AND id = ${id}
    RETURNING *
  `;

  return mapTodo(row);
}

export async function deleteTodo(id, userId = "demo") {
  await prepareTodos(userId);
  const rows = await sql`DELETE FROM todos WHERE user_id = ${userId} AND id = ${id} RETURNING id`;
  return rows.length > 0;
}
