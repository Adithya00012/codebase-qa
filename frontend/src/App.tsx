import { useState } from "react";

function App() {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [files, setFiles] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const res = await fetch("http://localhost:4000/repos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, url }),
  });
  const repo = await res.json();

  if (!repo.id) {
    console.error("repo creation failed:", repo);
    return;
  }

  const filesRes = await fetch(`http://localhost:4000/repos/${repo.id}/files`);
  const data = await filesRes.json();
  setFiles(data.files ?? []);
};

  return (
    <div>
      <h1>Codebase Q&A</h1>
      <form onSubmit={handleSubmit}>
        <input placeholder="repo name" value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="repo URL" value={url} onChange={(e) => setUrl(e.target.value)} />
        <button type="submit">Add Repo</button>
      </form>
      <ul>
        {files.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;