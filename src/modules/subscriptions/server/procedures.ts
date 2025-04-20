import db from "@/db";
import { subscriptions, users } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, getTableColumns, lt, or } from "drizzle-orm";
import { z } from "zod";

export const subscriptionsRouter = createTRPCRouter({
  getMany: protectedProcedure
    .input(
      z.object({
        cursor: z
          .object({
            creatorId: z.string().uuid(),
            updatedAt: z.date(),
          })
          .nullish(),
        limit: z.number().min(1).max(100),
      })
    )
    .query(async ({ input, ctx }) => {
      const { limit, cursor } = input;
      const { user } = ctx;

      const data = await db
        .select({
          ...getTableColumns(subscriptions),
          user: {
            ...getTableColumns(users),
            subscriberCount: db.$count(
              subscriptions,
              eq(subscriptions.creatorId, users.id)
            ),
          },
        })
        .from(subscriptions)
        .innerJoin(users, eq(subscriptions.creatorId, users.id))
        .where(
          and(
            eq(subscriptions.viewerId, user.id),
            cursor
              ? or(
                  lt(subscriptions.updatedAt, cursor.updatedAt),
                  and(
                    eq(subscriptions.updatedAt, cursor.updatedAt),
                    lt(subscriptions.creatorId, cursor.creatorId)
                  )
                )
              : undefined
          )
        )
        .orderBy(desc(subscriptions.updatedAt), desc(subscriptions.creatorId))
        // 多取一个，看看还有没有剩余的
        .limit(limit + 1);
      const hasMore = data.length > limit;
      // 如果还有更多，就删除最后一项，下一次获取Cursor就从最后一项开始
      const items = hasMore ? data.slice(0, -1) : data;
      const lastItem = items[items.length - 1];
      const nextCursor = hasMore
        ? {
            creatorId: lastItem.creatorId,
            updatedAt: lastItem.updatedAt,
          }
        : null;
      return {
        items,
        nextCursor,
      };
    }),
  create: protectedProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = input;
      // 自己订阅自己---❌
      if (userId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }
      const [createdSubscription] = await db
        .insert(subscriptions)
        .values({
          viewerId: ctx.user.id,
          creatorId: userId,
        })
        .returning();
      return createdSubscription;
    }),
  remove: protectedProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = input;
      if (userId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }
      const [deletedSubscription] = await db
        .delete(subscriptions)
        .where(
          and(
            eq(subscriptions.viewerId, ctx.user.id),
            eq(subscriptions.creatorId, userId)
          )
        )
        .returning();
      return deletedSubscription;
    }),
});
