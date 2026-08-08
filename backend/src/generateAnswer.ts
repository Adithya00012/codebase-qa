import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

type Chunk = { filePath: string; content: string };

export async function generateAnswer(question: string, chunks: Chunk[]) {
    const context = chunks
        .map((c, i) => `[${i + 1}] File: ${c.filePath}\n${c.content}`)
        .join("\n\n");

    const prompt = `You are a codebase assistant. Answer the question using ONLY the context below. Cite sources using [1], [2] etc matching the file references.

Context:
${context}

Question: ${question}

Answer:`;

    const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
    });

    return completion.choices[0]?.message?.content ?? "No answer generated.";
}