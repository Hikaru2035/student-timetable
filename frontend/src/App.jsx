import { useEffect, useState } from "react";

const API = "http://172.16.220.86:3000/api/todos";

function App() {
  const [todos, setTodos] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    task: "",
    deadline: "",
    status: "todo"
  });

  useEffect(() => {
    fetch(API)
      .then(res => res.json())
      .then(setTodos);
  }, []);

  const openAdd = () => {
    setSelected(null);
    setForm({ task: "", deadline: "", status: "todo" });
    setShowModal(true);
  };

  const openEdit = (todo) => {
    setSelected(todo);
    setForm(todo);
    setShowModal(true);
  };

  const submit = async () => {
    if (selected) {
      const res = await fetch(`${API}/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const updated = await res.json();
      setTodos(todos.map(t => t.id === updated.id ? updated : t));
    } else {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const created = await res.json();
      setTodos([...todos, created]);
    }
    setShowModal(false);
  };

  const remove = async (id) => {
    await fetch(`${API}/${id}`, { method: "DELETE" });
    setTodos(todos.filter(t => t.id !== id));
    setShowModal(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Todo List</h1>

      <button onClick={openAdd}>Add Task</button>

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>✔</th>
            <th>Task</th>
            <th>Deadline</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {todos.map(t => (
            <tr key={t.id}>
              <td>
                <input
                  type="checkbox"
                  checked={t.checked}
                  onChange={() =>
                    setTodos(todos.map(x =>
                      x.id === t.id ? { ...x, checked: !x.checked } : x
                    ))
                  }
                />
              </td>
              <td>{t.task}</td>
              <td>{t.deadline}</td>
              <td>{t.status}</td>
              <td>
                {t.checked && (
                  <>
                    <button onClick={() => openEdit(t)}>Update</button>
                    <button onClick={() => remove(t.id)}>Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div style={{
          position: "fixed",
          top: "30%",
          left: "30%",
          background: "#fff",
          padding: 20,
          border: "1px solid black"
        }}>
          <h3>{selected ? "Update Task" : "Add Task"}</h3>

          <input
            placeholder="Task"
            value={form.task}
            onChange={e => setForm({ ...form, task: e.target.value })}
          />
          <br />

          <input
            type="date"
            value={form.deadline}
            onChange={e => setForm({ ...form, deadline: e.target.value })}
          />
          <br />

          <select
            value={form.status}
            onChange={e => setForm({ ...form, status: e.target.value })}
          >
            <option value="todo">Todo</option>
            <option value="doing">Doing</option>
            <option value="done">Done</option>
          </select>

          <br /><br />
          <button onClick={submit}>Save</button>
          <button onClick={() => setShowModal(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
}

export default App;
