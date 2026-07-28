import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const { data, isLoading, error } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const response = await api.auth.me();
      return response.data;
    },
    enabled: !!token,
    retry: false,
    staleTime: Infinity, // Don't auto-refetch the user aggressively
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await api.auth.logout();
    },
    onSettled: () => {
      localStorage.removeItem('token');
      queryClient.clear();
      router.push('/login');
    },
  });

  return {
    user: data?.user || null,
    isLoading,
    error,
    logout: () => logoutMutation.mutate(),
    isLoggingOut: logoutMutation.isPending,
  };
}
