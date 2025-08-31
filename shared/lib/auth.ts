import { betterAuth } from "better-auth"
import { Pool } from "pg"

// Create a connection pool for Better Auth
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  // Optimize for serverless
  max: 1,
  idleTimeoutMillis: 0,
  connectionTimeoutMillis: 5000,
})

export const auth = betterAuth({
  database: pool,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Disable email verification for now
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  ],
  logger: {
    level: process.env.NODE_ENV === "development" ? "debug" : "warn",
  },
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
})

// Export types for client usage
export type Session = typeof auth.$Infer.Session.session
export type User = typeof auth.$Infer.Session.user