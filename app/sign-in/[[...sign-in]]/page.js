"use client";

import Link from "next/link";
import { useState } from "react";

export default function SignInPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "登录失败");
      }

      window.location.assign("/");
    } catch (err) {
      setError(err.message || "登录失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="reading-shell auth-page">
      <section className="auth-copy">
        <p className="eyebrow">阅读实验室</p>
        <h1>回到你的私人书房。</h1>
        <p>现在账号、密码和登录状态都由你的 Neon 数据库保存，不再经过 Clerk。</p>
        <Link href="/">返回首页</Link>
      </section>

      <form className="auth-card" onSubmit={submit}>
        <h2>邮箱密码登录</h2>
        {error ? <p className="error-banner">{error}</p> : null}
        <label>
          邮箱
          <input
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            required
          />
        </label>
        <label>
          密码
          <input
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            required
          />
        </label>
        <button className="primary" type="submit" disabled={busy}>
          {busy ? "登录中..." : "登录"}
        </button>
        <p>
          还没有账号？<Link href="/sign-up">创建账号</Link>
        </p>
      </form>
    </main>
  );
}
