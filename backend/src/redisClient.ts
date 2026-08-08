import { createClient } from "redis";

export const redisClient = createClient();

redisClient.on("error", (err) => console.error("Redis error:", err));

let connected = false;
export async function getRedisClient() {
    if (!connected) {
        await redisClient.connect();
        connected = true;
    }
    return redisClient;
}