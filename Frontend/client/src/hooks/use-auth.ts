import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/models/auth";
import { apiFetch, apiPost, clearStoredToken } from "@/lib/api";

/** Backend /api/auth/me returns this shape. */
export interface ApiUser {
  id: number;
  email: string;
  provider: string;
  is_whitelisted: boolean;
  is_active: boolean;
}

function apiUserToUser(api: ApiUser): User {
  return {
    id: String(api.id),
    email: api.email,
    authProvider: api.provider as "email" | "google",
    firstName: null,
    lastName: null,
    profileImageUrl: null,
    createdAt: null,
    updatedAt: null,
  } as User;
}

async function fetchUser(): Promise<User | null> {
  const response = await apiFetch("/api/auth/me");

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  const data: ApiUser = await response.json();
  return apiUserToUser(data);
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      clearStoredToken();
      const res = await apiPost("/api/auth/logout");
      if (!res.ok && res.status !== 204) throw new Error("Failed to logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      window.location.href = "/";
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
