// redis：一个内存数据库，在upstash的帮助下只用使用redis的api
// 第一次访问时，从数据库加载数据并存入 Redis。
// 后续访问时，直接从 Redis 读取数据，速度更快

import { Redis } from "@upstash/redis";
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});
// 测试 Redis 连接
// redis
//   .ping()
//   .then(() => console.log("Redis connected successfully"))
//   .catch((err) => console.error("Redis connection failed:", err));
