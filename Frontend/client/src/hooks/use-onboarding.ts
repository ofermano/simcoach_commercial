import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useAuth } from "./use-auth";
import { apiFetch } from "@/lib/api";

export type QuestionnaireInput = {
  displayName: string;
  drivingLevel: string;
  goal: string;
  drivingStyle: string;
};

export function useWhitelistCheck() {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: [api.whitelist.check.path],
    queryFn: async () => {
      const res = await apiFetch(api.whitelist.check.path);
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to check whitelist");
      return api.whitelist.check.responses[200].parse(await res.json());
    },
    enabled: isAuthenticated,
    retry: false,
  });
}

export function useQuestionnaireStatus(isWhitelisted?: boolean) {
  return useQuery({
    queryKey: [api.questionnaire.get.path],
    queryFn: async () => {
      const res = await apiFetch(api.questionnaire.get.path);
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to fetch questionnaire status");
      return api.questionnaire.get.responses[200].parse(await res.json());
    },
    enabled: !!isWhitelisted,
    retry: false,
  });
}

export function useSubmitQuestionnaire() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: QuestionnaireInput) => {
      const res = await apiFetch(api.questionnaire.submit.path, {
        method: api.questionnaire.submit.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.questionnaire.submit.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to submit questionnaire");
      }
      return api.questionnaire.submit.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.questionnaire.get.path] });
    },
  });
}
