import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export async function chunkFile(content: string, language: "js" | "python") {
  const splitter = RecursiveCharacterTextSplitter.fromLanguage(language, {
    chunkSize: 1000,
    chunkOverlap: 100,
  });

  const chunks = await splitter.splitText(content);
  return chunks;
}