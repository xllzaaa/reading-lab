"use client";

import Link from "next/link";
import { useState } from "react";

export default function SignUpPage() {
  const [form, setForm] = useState({ displayName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "注册失败");
      }

      window.location.assign("/");
    } catch (err) {
      setError(err.message || "注册失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="reading-shell auth-page">
      <section className="auth-copy">
        <p className="eyebrow">阅读实验室</p>
        <h1>创建你的独立阅读空间。</h1>
        <p>只需要邮箱和密码。密码会用 scrypt 哈希后存入 Neon，不会保存明文。</p>
        <Link href="/">返回首页</Link>
      </section>

      <form className="auth-card" onSubmit={submit}>
        <h2>创建账号</h2>
        {error ? <p className="error-banner">{error}</p> : null}
        <label>
          昵称
          <input
            autoComplete="name"
            value={form.displayName}
            onChange={(event) => setForm((prev) => ({ ...prev, displayName: event.target.value }))}
            placeholder="比如：小林"
          />
        </label>
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
            autoComplete="new-password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            placeholder="至少 8 位，包含字母和数字"
            required
          />
        </label>
        <button className="primary" type="submit" disabled={busy}>
          {busy ? "创建中..." : "创建并登录"}
        </button>
        <p>
          已有账号？<Link href="/sign-in">直接登录</Link>
        </p>
      </form>
    </main>
  );
}
