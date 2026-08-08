import { useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
};

function App() {
  const [repoName, setRepoName] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [repoId, setRepoId] = useState<string | null>(null);
  const [ingesting, setIngesting] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [asking, setAsking] = useState(false);

  const handleAddRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIngesting(true);
    const res = await fetch("http://localhost:4000/repos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: repoName, url: repoUrl }),
    });
    const repo = await res.json();
    if (!repo.id) {
      setIngesting(false);
      return;
    }
    setRepoId(repo.id);
    await fetch(`http://localhost:4000/repos/${repo.id}/ingest`, { method: "POST" });
    setIngesting(false);
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoId || !question) return;

    const userMsg: Message = { role: "user", content: question };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setAsking(true);

    const res = await fetch(
      `http://localhost:4000/repos/${repoId}/ask?q=${encodeURIComponent(question)}`
    );
    const data = await res.json();
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: data.answer, sources: data.sources },
    ]);
    setAsking(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-blue-600 mb-6">Codebase Q&A</h1>

      <form onSubmit={handleAddRepo} className="flex gap-2 mb-6">
        <input
          className="border rounded px-3 py-2 flex-1"
          placeholder="repo name"
          value={repoName}
          onChange={(e) => setRepoName(e.target.value)}
        />
        <input
          className="border rounded px-3 py-2 flex-1"
          placeholder="repo URL"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
        />
        <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">
          {ingesting ? "Loading..." : "Add Repo"}
        </button>
      </form>

      {repoId && (
        <>
          <div className="border rounded p-4 mb-4 h-96 overflow-y-auto space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                <div
                  className={
                    "inline-block px-3 py-2 rounded " +
                    (m.role === "user" ? "bg-blue-100" : "bg-gray-100")
                  }
                >
                  {m.content}
                </div>
                {m.sources && (
                  <div className="text-xs text-gray-500 mt-1">
                    Sources: {[...new Set(m.sources)].join(", ")}
                  </div>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleAsk} className="flex gap-2">
            <input
              className="border rounded px-3 py-2 flex-1"
              placeholder="Ask about the codebase..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">
              {asking ? "..." : "Ask"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default App;