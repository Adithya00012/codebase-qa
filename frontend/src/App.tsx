import { useState } from "react";

function App() {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const res = await fetch("http://localhost:4000/repos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, url }),
  });
  const data = await res.json();
  console.log(data);
};

  return (
    <div>
      <h1>Codebase Q&A</h1>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="repo name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="repo URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button type="submit">Add Repo</button>
      </form>
    </div>
  );
}

export default App;