import express from "express";
import { cloneRepo } from "./cloneRepo";
import { prisma } from "./prismaClient";

const app = express();
app.use(express.json());
const PORT = 4000;

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});


app.post("/repos", async (req, res) => {
  const { name, url } = req.body;

  if (!name || !url) {
    return res.status(400).json({ error: "name and url are required" });
  }

  try {
    await cloneRepo(url, name);
    const repo = await prisma.repo.create({
      data: { name, url },
    });
    res.json(repo);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});