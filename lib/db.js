import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("缺少 DATABASE_URL 或 POSTGRES_URL 环境变量");
}

export const sql = neon(connectionString);

let schemaReady;

export async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS books (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL,
          title TEXT NOT NULL,
          author TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT '想读',
          progress INTEGER NOT NULL DEFAULT 0,
          total_pages INTEGER NOT NULL,
          theme TEXT NOT NULL DEFAULT '效率',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS books_user_id_idx ON books (user_id)`;

      await sql`
        CREATE TABLE IF NOT EXISTS checkins (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL,
          date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
          pages INTEGER NOT NULL,
          minutes INTEGER NOT NULL
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS checkins_user_date_idx ON checkins (user_id, date DESC)`;

      await sql`
        CREATE TABLE IF NOT EXISTS quotes (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL,
          book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
          text TEXT NOT NULL,
          note TEXT NOT NULL DEFAULT '',
          source_page INTEGER NOT NULL,
          review_stage INTEGER NOT NULL DEFAULT 0,
          next_review_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS quotes_user_review_idx ON quotes (user_id, next_review_at)`;

      await sql`
        CREATE TABLE IF NOT EXISTS notes (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL,
          book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
          chapter INTEGER NOT NULL,
          summary TEXT NOT NULL,
          action TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS notes_user_created_idx ON notes (user_id, created_at DESC)`;

      await sql`
        CREATE TABLE IF NOT EXISTS todos (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL,
          text TEXT NOT NULL,
          done BOOLEAN NOT NULL DEFAULT FALSE,
          priority TEXT NOT NULL DEFAULT '中',
          book_id INTEGER REFERENCES books(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS todos_user_created_idx ON todos (user_id, created_at DESC)`;

      await sql`
        CREATE TABLE IF NOT EXISTS share_profiles (
          user_id TEXT PRIMARY KEY,
          slug TEXT UNIQUE NOT NULL,
          enabled BOOLEAN NOT NULL DEFAULT TRUE,
          display_name TEXT NOT NULL DEFAULT '我的阅读实验室',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
    })();
  }

  return schemaReady;
}
