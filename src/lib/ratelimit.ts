import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";
/**
 *
 * redis是内存数据库， 限流数据存储在 Redis 中，方便快速读写。
 * limiter添加限流规则
 */
export const ratelimit = new Ratelimit({
  redis: redis, // 使用 Upstash 的 Redis 实例
  limiter: Ratelimit.slidingWindow(100, "10s"), // 限流规则：10 秒内最多 50 次请求
});
// 假设你有一个 API，用户可以通过它查询数据。为了防止用户频繁调用 API（比如恶意刷数据），你可以用限流功能：
// 如果用户在 10 秒内调用超过 50 次，就拒绝后续请求。
