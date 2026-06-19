import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from "next-auth/next";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetUserId, action } = await req.json(); // action: "UPVOTE" | "DOWNVOTE"
    
    if (!targetUserId || !action) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // In a full implementation, we should track votes in a UserVote table to prevent duplicate votes.
    // Here we just increment/decrement the reputation score directly for the MVP.

    const incrementValue = action === 'UPVOTE' ? 1 : -1;

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        reputationScore: { increment: incrementValue }
      }
    });

    return NextResponse.json({ success: true, newScore: updatedUser.reputationScore });
  } catch (error) {
    console.error("Reputation API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
