export interface UserProfile {
  id: string
  name: string | null
  email: string | null
  image: string | null
}

export interface AuthError {
  error: string
  message?: string
}