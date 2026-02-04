import { NextRequest, NextResponse } from "next/server";
import { validateCredentials, createSession, setSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Validate credentials (with bcrypt comparison)
    const user = await validateCredentials(username, password);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Create JWT session token
    const token = await createSession(user.username);

    // Set HTTP-only cookie
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      data: { username: user.username },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
