import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { env } from "@/env";

/**
 * GET /api/team/accept/[token]
 *
 * Accepts a team invitation.
 * - Not logged in → redirect to login with callbackUrl
 * - Logged in, email matches → create TeamMember, redirect to settings/team
 * - Error → redirect to settings/team with error param
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const session = await auth();
  const appUrl = env.NEXT_PUBLIC_APP_URL;

  // Not authenticated → redirect to login
  if (!session?.user) {
    const callbackUrl = encodeURIComponent(`/api/team/accept/${token}`);
    return NextResponse.redirect(`${appUrl}/login?callbackUrl=${callbackUrl}`);
  }

  const invitation = await db.teamInvitation.findUnique({
    where: { token },
    include: { team: { select: { name: true } } },
  });

  if (!invitation) {
    return NextResponse.redirect(`${appUrl}/settings/team?invite_error=not_found`);
  }
  if (invitation.acceptedAt) {
    return NextResponse.redirect(`${appUrl}/settings/team?invite_error=used`);
  }
  if (invitation.expiresAt < new Date()) {
    return NextResponse.redirect(`${appUrl}/settings/team?invite_error=expired`);
  }
  if (invitation.email.toLowerCase() !== session.user.email?.toLowerCase()) {
    return NextResponse.redirect(`${appUrl}/settings/team?invite_error=email_mismatch`);
  }

  // Guard: already in a team
  const existingMembership = await db.teamMember.findUnique({
    where: { userId: session.user.id },
  });
  if (existingMembership) {
    return NextResponse.redirect(`${appUrl}/settings/team?invite_error=already_member`);
  }

  // Guard: owns a team
  const ownedTeam = await db.team.findUnique({
    where: { ownerId: session.user.id },
  });
  if (ownedTeam) {
    return NextResponse.redirect(`${appUrl}/settings/team?invite_error=is_owner`);
  }

  await db.$transaction([
    db.teamMember.create({
      data: {
        teamId: invitation.teamId,
        userId: session.user.id,
        role: invitation.role,
      },
    }),
    db.teamInvitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    }),
  ]);

  // Detect locale from Accept-Language header (fallback to fr-FR)
  const acceptLang = req.headers.get("accept-language") ?? "";
  const locale = acceptLang.startsWith("en") ? "en-GB"
    : acceptLang.startsWith("de") ? "de-DE"
    : acceptLang.startsWith("es") ? "es-ES"
    : "fr-FR";

  return NextResponse.redirect(
    `${appUrl}/${locale}/settings/team?invite_success=1&team=${encodeURIComponent(invitation.team.name)}`,
  );
}
