import { useAuth } from '@/hooks/useAuth'

export function useProfile() {
  const { profile, loading, refreshProfile } = useAuth()
  return { profile, loading, refreshProfile }
}
