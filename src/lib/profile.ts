import { supabase } from './supabaseClient'

const MAX_AVATAR_BYTES = 2 * 1024 * 1024

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error('Image must be smaller than 2MB.')
  }

  const extension = file.name.split('.').pop() ?? 'jpg'
  const path = `${userId}/${crypto.randomUUID()}.${extension}`

  const { error } = await supabase.storage.from('avatars').upload(path, file)
  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}

export async function updateOwnProfile(updates: {
  username?: string | null
  avatarUrl?: string | null
}): Promise<void> {
  const { error } = await supabase.rpc('update_own_profile', {
    new_username: updates.username ?? null,
    new_avatar_url: updates.avatarUrl ?? null,
  })
  if (error) throw new Error(error.message)
}
