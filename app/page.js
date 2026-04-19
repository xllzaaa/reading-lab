"use client";

import { useEffect, useMemo, useState } from "react";

const STATUS_OPTIONS = ["想读", "在读", "读完"];
const STATUS_CLASS = {
  想读: "wishlist",
  在读: "reading",
  读完: "finished",
};

async function api(path, options) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "请求失败");
  }
  return data;
}

export default function HomePage() {
  const [dashboard, setDashboard] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selectedBookId, setSelectedBookId] = useState(0);

  const [bookForm, setBookForm] = useState({
    title: "",
    author: "",
    totalPages: "",
    theme: "效率",
  });
  const [checkinForm, setCheckinForm] = useState({ pages: "", minutes: "" });
  const [quoteForm, setQuoteForm] = useState({ text: "", note: "", sourcePage: "" });
  const [noteForm, setNoteForm] = useState({ chapter: "", summary: "", action: "" });

  const [prompts, setPrompts] = useState([]);
  const [recommendTheme, setRecommendTheme] = useState("效率");
  const [recommendations, setRecommendations] = useState([]);
  const [discussionKit, setDiscussionKit] = useState(null);

  async function loadDashboard() {
    setBusy(true);
    setError("");
    try {
      const data = await api("/api/dashboard");
      setDashboard(data);
      if (!selectedBookId && data.books[0]) {
        setSelectedBookId(data.books[0].id);
      }
    } catch (err) {
      setError(err.message || "加载失败");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (!selectedBookId) {
      return;
    }

    (async () => {
      const [promptData, recData, discussionData] = await Promise.all([
        api(`/api/prompts?bookId=${selectedBookId}`),
        api(`/api/recommendations?theme=${encodeURIComponent(recommendTheme)}`),
        api(`/api/discussion?bookId=${selectedBookId}`),
      ]);

      setPrompts(promptData.prompts || []);
      setRecommendations(recData.books || []);
      setDiscussionKit(discussionData.kit || null);
    })().catch((err) => {
      setError(err.message || "智能模块加载失败");
    });
  }, [selectedBookId, recommendTheme]);

  const books = dashboard?.books || [];
  const selectedBook = useMemo(
    () => books.find((item) => item.id === selectedBookId) || books[0] || null,
    [books, selectedBookId]
  );

  async function addBook(event) {
    event.preventDefault();
    try {
      await api("/api/books", {
        method: "POST",
        body: JSON.stringify({
          ...bookForm,
          totalPages: Number(bookForm.totalPages),
        }),
      });
      setBookForm({ title: "", author: "", totalPages: "", theme: recommendTheme });
      await loadDashboard();
    } catch (err) {
      setError(err.message || "新增书籍失败");
    }
  }

  async function updateBook(id, patch) {
    try {
      await api(`/api/books/${id}`, {
        method: "PUT",
        body: JSON.stringify(patch),
      });
      await loadDashboard();
    } catch (err) {
      setError(err.message || "更新书籍失败");
    }
  }

  async function addCheckin(event) {
    event.preventDefault();
    if (!selectedBook) return;

    try {
      await api("/api/checkins", {
        method: "POST",
        body: JSON.stringify({
          bookId: selectedBook.id,
          pages: Number(checkinForm.pages),
          minutes: Number(checkinForm.minutes),
        }),
      });
      setCheckinForm({ pages: "", minutes: "" });
      await loadDashboard();
    } catch (err) {
      setError(err.message || "打卡失败");
    }
  }

  async function addQuote(event) {
    event.preventDefault();
    if (!selectedBook) return;

    try {
      await api("/api/quotes", {
        method: "POST",
        body: JSON.stringify({
          bookId: selectedBook.id,
          text: quoteForm.text,
          note: quoteForm.note,
          sourcePage: Number(quoteForm.sourcePage),
        }),
      });
      setQuoteForm({ text: "", note: "", sourcePage: "" });
      await loadDashboard();
    } catch (err) {
      setError(err.message || "保存摘录失败");
    }
  }

  async function addNote(event) {
    event.preventDefault();
    if (!selectedBook) return;

    try {
      await api("/api/notes", {
        method: "POST",
        body: JSON.stringify({
          bookId: selectedBook.id,
          chapter: Number(noteForm.chapter),
          summary: noteForm.summary,
          action: noteForm.action,
        }),
      });
      setNoteForm({ chapter: "", summary: "", action: "" });
      await loadDashboard();
    } catch (err) {
      setError(err.message || "保存章节笔记失败");
    }
  }

  async function reviewQuote(id, remembered) {
    try {
      await api(`/api/quotes/${id}/review`, {
        method: "POST",
        body: JSON.stringify({ remembered }),
      });
      await loadDashboard();
    } catch (err) {
      setError(err.message || "复习记录失败");
    }
  }

  const stats = dashboard?.stats;

  return (
    <main className="reading-shell">
      <section className="hero" style={{ "--delay": "0ms" }}>
        <p className="eyebrow">阅读实验室</p>
        <h1>一本书，从进度到行动，在同一个工作台完成。</h1>
        <p className="hero-copy">记录阅读、沉淀摘录、触发复习、生成讨论提纲，把读书变成长期可积累的系统。</p>
      </section>

      {error ? <p className="error-banner">{error}</p> : null}

      <section className="stats-strip">
        <article className="stat" style={{ "--delay": "60ms" }}>
          <span>当前连续天数</span>
          <strong>{dashboard?.streak || 0} 天</strong>
        </article>
        <article className="stat" style={{ "--delay": "120ms" }}>
          <span>阅读经验值</span>
          <strong>{stats?.xp || 0}</strong>
        </article>
        <article className="stat" style={{ "--delay": "180ms" }}>
          <span>累计阅读页数</span>
          <strong>{stats?.totalPages || 0}</strong>
        </article>
        <article className="stat" style={{ "--delay": "240ms" }}>
          <span>在读书籍数</span>
          <strong>{stats?.readingCount || 0} 本</strong>
        </article>
      </section>

      <div className="workspace-grid">
        <section className="panel" style={{ "--delay": "80ms" }}>
          <h2>书架管理</h2>
          <p className="panel-sub">管理想读、在读、读完状态与进度。</p>

          <form className="form-grid" onSubmit={addBook}>
            <input
              placeholder="书名"
              value={bookForm.title}
              onChange={(event) => setBookForm((prev) => ({ ...prev, title: event.target.value }))}
            />
            <input
              placeholder="作者"
              value={bookForm.author}
              onChange={(event) => setBookForm((prev) => ({ ...prev, author: event.target.value }))}
            />
            <input
              type="number"
              min="1"
              placeholder="总页数"
              value={bookForm.totalPages}
              onChange={(event) => setBookForm((prev) => ({ ...prev, totalPages: event.target.value }))}
            />
            <select
              value={bookForm.theme}
              onChange={(event) => setBookForm((prev) => ({ ...prev, theme: event.target.value }))}
            >
              {(dashboard?.themes || []).map((theme) => (
                <option key={theme} value={theme}>
                  {theme}
                </option>
              ))}
            </select>
            <button className="primary" type="submit">
              添加书籍
            </button>
          </form>

          <ul className="book-list">
            {books.map((book) => (
              <li
                key={book.id}
                className={selectedBook?.id === book.id ? "active" : ""}
                onClick={() => setSelectedBookId(book.id)}
              >
                <header>
                  <h3>{book.title}</h3>
                  <span className={`tag tag-${STATUS_CLASS[book.status] || "wishlist"}`}>{book.status}</span>
                </header>
                <p>{book.author}</p>
                <div className="inline-controls">
                  <label>
                    阅读进度 {book.progress}%
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={book.progress}
                      onChange={(event) => updateBook(book.id, { progress: Number(event.target.value) })}
                    />
                  </label>
                  <select
                    value={book.status}
                    onChange={(event) => updateBook(book.id, { status: event.target.value })}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel" style={{ "--delay": "120ms" }}>
          <h2>每日打卡与挑战</h2>
          <p className="panel-sub">页数与时长双记录，驱动连续阅读习惯。</p>

          <form className="form-grid compact" onSubmit={addCheckin}>
            <input
              type="number"
              min="1"
              placeholder="今日页数"
              value={checkinForm.pages}
              onChange={(event) => setCheckinForm((prev) => ({ ...prev, pages: event.target.value }))}
            />
            <input
              type="number"
              min="1"
              placeholder="阅读时长(分钟)"
              value={checkinForm.minutes}
              onChange={(event) => setCheckinForm((prev) => ({ ...prev, minutes: event.target.value }))}
            />
            <button className="primary" type="submit" disabled={!selectedBook || busy}>
              立即打卡
            </button>
          </form>

          <div className="badge-row">
            {(stats?.badges || []).map((badge) => (
              <span key={badge} className="badge">
                {badge}
              </span>
            ))}
          </div>

          <ul className="timeline">
            {(dashboard?.checkins || []).slice(0, 6).map((entry) => {
              const book = books.find((item) => item.id === entry.bookId);
              return (
                <li key={entry.id}>
                  <strong>{new Date(entry.date).toLocaleDateString("zh-CN")}</strong>
                  <span>
                    {entry.pages} 页 / {entry.minutes} 分钟 · {book?.title || "未知书籍"}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="panel" style={{ "--delay": "160ms" }}>
          <h2>摘录与间隔复习</h2>
          <p className="panel-sub">按 1/3/7/14 天节奏复习重点内容。</p>

          <form className="form-grid" onSubmit={addQuote}>
            <textarea
              rows={3}
              placeholder="摘录原文"
              value={quoteForm.text}
              onChange={(event) => setQuoteForm((prev) => ({ ...prev, text: event.target.value }))}
            />
            <input
              placeholder="你的理解"
              value={quoteForm.note}
              onChange={(event) => setQuoteForm((prev) => ({ ...prev, note: event.target.value }))}
            />
            <input
              type="number"
              min="1"
              placeholder="原文页码"
              value={quoteForm.sourcePage}
              onChange={(event) => setQuoteForm((prev) => ({ ...prev, sourcePage: event.target.value }))}
            />
            <button className="primary" type="submit" disabled={!selectedBook}>
              保存摘录
            </button>
          </form>

          <ul className="quote-list">
            {(dashboard?.dueQuotes || []).map((quote) => (
              <li key={quote.id}>
                <p>“{quote.text}”</p>
                <small>应复习日期：{new Date(quote.nextReviewAt).toLocaleDateString("zh-CN")}</small>
                <div className="inline-buttons">
                  <button onClick={() => reviewQuote(quote.id, true)}>记住了</button>
                  <button onClick={() => reviewQuote(quote.id, false)}>再复习一次</button>
                </div>
              </li>
            ))}
            {(dashboard?.dueQuotes || []).length === 0 ? (
              <li>
                <p>当前没有到期摘录，继续保持阅读节奏。</p>
              </li>
            ) : null}
          </ul>
        </section>

        <section className="panel" style={{ "--delay": "200ms" }}>
          <h2>章节速记</h2>
          <p className="panel-sub">每章只写两件事：核心总结与下一步行动。</p>

          <form className="form-grid" onSubmit={addNote}>
            <input
              type="number"
              min="1"
              placeholder="章节"
              value={noteForm.chapter}
              onChange={(event) => setNoteForm((prev) => ({ ...prev, chapter: event.target.value }))}
            />
            <textarea
              rows={2}
              placeholder="本章总结"
              value={noteForm.summary}
              onChange={(event) => setNoteForm((prev) => ({ ...prev, summary: event.target.value }))}
            />
            <textarea
              rows={2}
              placeholder="行动项"
              value={noteForm.action}
              onChange={(event) => setNoteForm((prev) => ({ ...prev, action: event.target.value }))}
            />
            <button className="primary" type="submit" disabled={!selectedBook}>
              保存笔记
            </button>
          </form>

          <ul className="note-list">
            {(dashboard?.notes || []).slice(0, 5).map((note) => {
              const book = books.find((item) => item.id === note.bookId);
              return (
                <li key={note.id}>
                  <strong>
                    {book?.title || "未知书籍"} · 第 {note.chapter} 章
                  </strong>
                  <p>{note.summary}</p>
                  <small>行动：{note.action}</small>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="panel" style={{ "--delay": "240ms" }}>
          <h2>思考辅助</h2>
          <p className="panel-sub">自动给出复盘问题、主题书单与读书会提纲。</p>

          <div className="inline-controls">
            <label>
              主题路径
              <select value={recommendTheme} onChange={(event) => setRecommendTheme(event.target.value)}>
                {(dashboard?.themes || []).map((theme) => (
                  <option key={theme} value={theme}>
                    {theme}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <h3>读后反思问题</h3>
          <ul className="mini-list">
            {prompts.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3>主题书单建议</h3>
          <ul className="mini-list">
            {recommendations.map((title) => (
              <li key={title}>{title}</li>
            ))}
          </ul>

          {discussionKit ? (
            <>
              <h3>读书会提纲</h3>
              <p>{discussionKit.topic}</p>
              <ul className="mini-list">
                {discussionKit.questions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
              <small>
                投票问题：{discussionKit.poll.question}（{discussionKit.poll.options.join(" / ")}）
              </small>
            </>
          ) : null}
        </section>

        <section className="panel" style={{ "--delay": "280ms" }}>
          <h2>知识关系图</h2>
          <p className="panel-sub">把章节洞见与行动计划串成可复用结构。</p>

          <ul className="graph-list">
            {(dashboard?.graphLinks || []).map((item) => (
              <li key={item.id}>{item.link}</li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
