export type UserRole = 'user' | 'admin'

export interface Profile {
  id: string
  email: string
  role: UserRole
  username: string | null
  avatar_url: string | null
  created_at: string
}
