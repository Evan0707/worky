import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { pusher } from "@/lib/pusher";
import { db } from "@/server/db";

/**
 * Pusher private channel authentication endpoint.
 * Validates that the authenticated user is a member (or owner)
 * of the team they are trying to subscribe to.
 *
 * Channel format: private-team-{teamId}
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const formData = await req.formData();
  const socketId = formData.get("socket_id") as string;
  const channelName = formData.get("channel_name") as string;

  if (!socketId || !channelName) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  // Extract teamId from channel name "private-team-{teamId}"
  const match = channelName.match(/^private-team-(.+)$/);
  if (!match) {
    return new NextResponse("Invalid channel", { status: 403 });
  }
  const teamId = match[1]!;

  // Verify user is owner or member of this team
  const userId = session.user.id;

  const [ownedTeam, membership] = await Promise.all([
    db.team.findUnique({ where: { id: teamId, ownerId: userId } }),
    db.teamMember.findFirst({ where: { teamId, userId } }),
  ]);

  if (!ownedTeam && !membership) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const authResponse = pusher.authorizeChannel(socketId, channelName);
  return NextResponse.json(authResponse);
}
