import { createAuthClient } from "better-auth/react"
import type { Session, User } from "./auth"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
})

// Export auth methods for easy use
export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = authClient

// Helper hooks
export const useAuth = () => {
  const session = useSession()
  
  return {
    user: session.data?.user || null,
    session: session.data?.session || null,
    isLoading: session.isPending,
    isAuthenticated: !!session.data?.session,
    error: session.error,
  }
}

// Auth action helpers with error handling
export const authActions = {
  async signInWithEmailPassword(email: string, password: string) {
    try {
      const result = await signIn.email({
        email,
        password,
      })
      
      if (result.error) {
        throw new Error(result.error.message)
      }
      
      return result
    } catch (error) {
      console.error("Sign in error:", error)
      throw error
    }
  },

  async signUpWithEmailPassword(email: string, password: string, name?: string) {
    try {
      const result = await signUp.email({
        email,
        password,
        name: name || '',
      })
      
      if (result.error) {
        throw new Error(result.error.message)
      }
      
      return result
    } catch (error) {
      console.error("Sign up error:", error)
      throw error
    }
  },

  async signOutUser() {
    try {
      await signOut()
    } catch (error) {
      console.error("Sign out error:", error)
      throw error
    }
  },
}

// Type exports
export type { Session, User }