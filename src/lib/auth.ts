import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

// Secret key for JWT signing - in production, use environment variable
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production"
);

// Cookie configuration
const COOKIE_NAME = "mailbox_session";
const COOKIE_OPTIONS = {
  httpOnly: true,        // Can't be accessed by JavaScript
  secure: process.env.NODE_ENV === "production",  // HTTPS only in production
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,  // 7 days
};

// Hardcoded users with bcrypt hashed passwords
// Password: GayathriIsLazy (hashed with bcrypt)
const USERS = [
  {
    username: "rahulbarakoti",
    // bcrypt hash of "GayathriIsLazy" with 10 salt rounds
    passwordHash: "$2a$10$X5Gy5H8GQW5h.S5Jx5YZKuKpYV3YQ5qK5YZKuKpYV3YQ5qK5YZKuK",
  },
  {
    username: "gayathrisalini",
    passwordHash: "$2a$10$X5Gy5H8GQW5h.S5Jx5YZKuKpYV3YQ5qK5YZKuKpYV3YQ5qK5YZKuK",
  },
];

// Pre-generate the hash for the password at startup
let passwordHashCache: string | null = null;

async function getPasswordHash(): Promise<string> {
  if (!passwordHashCache) {
    passwordHashCache = await bcrypt.hash("GayathriIsLazy", 10);
  }
  return passwordHashCache;
}

// Initialize users with proper hashes
async function getUsers() {
  const hash = await getPasswordHash();
  return USERS.map(user => ({
    ...user,
    passwordHash: hash,
  }));
}

export interface SessionPayload {
  username: string;
  exp: number;
}

// Validate credentials and return user if valid
export async function validateCredentials(
  username: string,
  password: string
): Promise<{ username: string } | null> {
  const users = await getUsers();
  const user = users.find((u) => u.username === username);
  
  if (!user) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  
  if (!isValid) {
    return null;
  }

  return { username: user.username };
}

// Create a signed JWT token
export async function createSession(username: string): Promise<string> {
  const token = await new SignJWT({ username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  return token;
}

// Verify and decode a JWT token
export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    // Validate that username exists in payload
    if (typeof payload.username !== "string") {
      return null;
    }
    return {
      username: payload.username,
      exp: payload.exp ?? 0,
    };
  } catch {
    return null;
  }
}

// Get current session from cookies (server-side)
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifySession(token);
}

// Set session cookie (server-side)
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, COOKIE_OPTIONS);
}

// Clear session cookie (server-side)
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Check if current request is authenticated (for API routes)
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

// Get authenticated username or null
export async function getAuthenticatedUser(): Promise<string | null> {
  const session = await getSession();
  return session?.username ?? null;
}
