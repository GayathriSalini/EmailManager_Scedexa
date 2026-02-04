import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({
        success: true,
        data: { isAuthenticated: false, user: null },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        isAuthenticated: true,
        user: { username: session.username },
      },
    });
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
