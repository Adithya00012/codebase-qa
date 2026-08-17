import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
};

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const [repoName, setRepoName] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [repoId, setRepoId] = useState<string | null>(null);
  const [ingesting, setIngesting] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [asking, setAsking] = useState(false);

  const handleLogout = () => {
    setToken(null);
    setRepoId(null);
    setMessages([]);
    setRepoName("");
    setRepoUrl("");
    setEmail("");
    setPassword("");
  };

  const handleAuth = async (mode: "signup" | "login") => {
    setAuthError("");
    const res = await fetch(`${API_URL}/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!data.token) {
      setAuthError(data.error || "Auth failed");
      return;
    }
    setToken(data.token);
  };

  const handleAddRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIngesting(true);
    const res = await fetch(`${API_URL}/repos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: repoName, url: repoUrl }),
    });
    const repo = await res.json();
    if (!repo.id) {
      setIngesting(false);
      return;
    }
    setRepoId(repo.id);
    await fetch(`${API_URL}/repos/${repo.id}/ingest`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
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
      `${API_URL}/repos/${repoId}/ask?q=${encodeURIComponent(question)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: data.answer, sources: data.sources },
    ]);
    setAsking(false);
  };

  if (!token) {
    return (
      <div className="max-w-sm mx-auto p-6 mt-20">
        <h1 className="text-2xl font-bold text-blue-600 mb-4">Codebase Q&A</h1>
        <input
          className="border rounded px-3 py-2 w-full mb-2"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="border rounded px-3 py-2 w-full mb-2"
          placeholder="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {authError && <p className="text-red-600 text-sm mb-2">{authError}</p>}
        <div className="flex gap-2">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded flex-1"
            onClick={() => handleAuth("signup")}
          >
            Sign Up
          </button>
          <button
            className="bg-gray-600 text-white px-4 py-2 rounded flex-1"
            onClick={() => handleAuth("login")}
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-600">Codebase Q&A</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-600 hover:text-red-600 border rounded px-3 py-1"
        >
          Logout
        </button>
      </div>

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
