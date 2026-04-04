import { type PrismaClient } from "@prisma/client";

/**
 * Resolves the effective artisanId for a given user.
 *
 * - Solo user or team OWNER → their own userId
 * - Team MEMBER / ADMIN     → the team owner's userId
 *
 * All project queries must use this artisanId so team members share
 * the same project space as the team owner.
 */
export async function getArtisanContext(
  userId: string,
  db: PrismaClient,
): Promise<{ artisanId: string; isTeamMember: boolean; teamId: string | null }> {
  const membership = await db.teamMember.findUnique({
    where: { userId },
    select: {
      teamId: true,
      team: { select: { ownerId: true } },
    },
  });

  if (membership) {
    return {
      artisanId: membership.team.ownerId,
      isTeamMember: true,
      teamId: membership.teamId,
    };
  }

  return { artisanId: userId, isTeamMember: false, teamId: null };
}

/**
 * Resolves the effective plan for billing checks.
 * Team members inherit the team owner's plan.
 */
export async function getEffectivePlan(
  userId: string,
  db: PrismaClient,
): Promise<"FREE" | "PRO"> {
  const { artisanId } = await getArtisanContext(userId, db);

  const owner = await db.user.findUnique({
    where: { id: artisanId },
    select: { plan: true },
  });

  return (owner?.plan ?? "FREE") as "FREE" | "PRO";
}
