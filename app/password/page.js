"use client";

import Link from "next/link";
import { useState } from "react";

export default function PasswordPage() {
  const [form, setForm] = useState({ currentPassword: "", nextPassword: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "修改密码失败");
      }

      setForm({ currentPassword: "", nextPassword: "" });
      setMessage("密码已更新，下次登录请使用新密码。");
    } catch (err) {
      setError(err.message || "修改密码失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="reading-shell auth-page">
      <section className="auth-copy">
        <p className="eyebrow">账号安全</p>
        <h1>修改你的登录密码。</h1>
        <p>新密码会重新哈希后写入 Neon，旧 session 保持登录，下一次登录使用新密码。</p>
        <Link href="/">返回工作台</Link>
      </section>

      <form className="auth-card" onSubmit={submit}>
        <h2>修改密码</h2>
        {error ? <p className="error-banner">{error}</p> : null}
        {message ? <p className="success-banner">{message}</p> : null}
        <label>
          当前密码
          <input
            type="password"
            autoComplete="current-password"
            value={form.currentPassword}
            onChange={(event) => setForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
            required
          />
        </label>
        <label>
          新密码
          <input
            type="password"
            autoComplete="new-password"
            value={form.nextPassword}
            onChange={(event) => setForm((prev) => ({ ...prev, nextPassword: event.target.value }))}
            placeholder="至少 8 位，包含字母和数字"
            required
          />
        </label>
        <button className="primary" type="submit" disabled={busy}>
          {busy ? "保存中..." : "保存新密码"}
        </button>
      </form>
    </main>
  );
}
