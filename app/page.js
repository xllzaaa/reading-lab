"use client";

import { useEffect, useState } from "react";

export default function HomePage() {
  const [todos, setTodos] = useState([]);
  const [newText, setNewText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadTodos() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/todos", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to fetch todos");
      }

      const data = await response.json();
      setTodos(data.todos || []);
    } catch (err) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTodos();
  }, []);

  async function addTodo(event) {
    event.preventDefault();
    const text = newText.trim();
    if (!text) {
      return;
    }

    const response = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (response.ok) {
      setNewText("");
      await loadTodos();
    }
  }

  async function toggleDone(todo) {
    await fetch(`/api/todos/${todo.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !todo.done }),
    });

    await loadTodos();
  }

  async function renameTodo(todo) {
    const text = window.prompt("Update todo", todo.text);
    if (!text || !text.trim()) {
      return;
    }

    await fetch(`/api/todos/${todo.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.trim() }),
    });

    await loadTodos();
  }

  async function removeTodo(todoId) {
    await fetch(`/api/todos/${todoId}`, { method: "DELETE" });
    await loadTodos();
  }

  return (
    <main>
      <h1>Hello, Vibe Coding!</h1>
      <p>Minimal Next.js app with in-memory CRUD todos.</p>

      <section className="card">
        <form className="row" onSubmit={addTodo}>
          <input
            type="text"
            value={newText}
            onChange={(event) => setNewText(event.target.value)}
            placeholder="Add a todo"
            aria-label="New todo"
          />
          <button type="submit" className="primary">
            Add
          </button>
        </form>

        {loading ? <p className="muted">Loading todos...</p> : null}
        {error ? <p className="muted">Error: {error}</p> : null}

        {!loading && todos.length === 0 ? <p className="muted">No todos yet.</p> : null}

        <ul>
          {todos.map((todo) => (
            <li key={todo.id}>
              <div className="row">
                <input
                  type="checkbox"
                  checked={todo.done}
                  onChange={() => toggleDone(todo)}
                  aria-label={`Mark ${todo.text} as ${todo.done ? "not done" : "done"}`}
                />
                <span className={`todo-text ${todo.done ? "done" : ""}`}>{todo.text}</span>
                <button type="button" onClick={() => renameTodo(todo)}>
                  Rename
                </button>
                <button type="button" onClick={() => removeTodo(todo.id)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
