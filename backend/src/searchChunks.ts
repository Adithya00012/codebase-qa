import { prisma } from "./prismaClient";
import { embedText } from "./embedText";

type SearchResult = {
  id: string;
  filePath: string;
  content: string;
  distance: number;
};

export async function searchChunks(repoId: string, query: string, topK = 5) {
  const queryVector = await embedText(query);
  const vectorString = "[" + queryVector.join(",") + "]";

  const results = (await prisma.$queryRawUnsafe(
    `SELECT id, "filePath", content, embedding <=> $1::vector AS distance
     FROM "Chunk"
     WHERE "repoId" = $2
     ORDER BY distance ASC
     LIMIT $3`,
    vectorString,
    repoId,
    topK
  )) as SearchResult[];

  return results;
}
