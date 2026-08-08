import { prisma } from "./prismaClient";

export async function saveEmbedding(chunkId: string, embedding: number[]) {
  const vectorString = `[${embedding.join(",")}]`;
  await prisma.$executeRawUnsafe(
    `UPDATE "Chunk" SET embedding = $1::vector WHERE id = $2`,
    vectorString,
    chunkId
  );
}