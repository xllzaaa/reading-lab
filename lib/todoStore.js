const initialTodos = [
  { id: 1, text: "Finish the vibe coding setup", done: false },
  { id: 2, text: "Ship first deploy on Vercel", done: false },
];

if (!globalThis.__todoStore) {
  globalThis.__todoStore = {
    todos: [...initialTodos],
    nextId: initialTodos.length + 1,
  };
}

const store = globalThis.__todoStore;

export function listTodos() {
  return store.todos;
}

export function getTodo(id) {
  return store.todos.find((todo) => todo.id === id) || null;
}

export function createTodo(text) {
  const todo = {
    id: store.nextId++,
    text,
    done: false,
  };

  store.todos.push(todo);
  return todo;
}

export function updateTodo(id, patch) {
  const todo = getTodo(id);
  if (!todo) {
    return null;
  }

  if (typeof patch.text === "string") {
    todo.text = patch.text;
  }

  if (typeof patch.done === "boolean") {
    todo.done = patch.done;
  }

  return todo;
}

export function deleteTodo(id) {
  const index = store.todos.findIndex((todo) => todo.id === id);
  if (index === -1) {
    return false;
  }

  store.todos.splice(index, 1);
  return true;
}
