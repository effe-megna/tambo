import type TamboAI from "@tambo-ai/typescript-sdk";
import { UseQueryOptions } from "@tanstack/react-query";
import { useTamboClient } from "../providers/tambo-client-provider";
import { useTamboProject } from "../providers/tambo-project-provider";
import { useTamboQuery } from "./react-query-hooks";

interface UseTamboThreadListConfig {
  /**
   * The projectId to get the threads for. If not provided, the current project
   * will be used.
   */
  projectId?: string;
  /**
   * The context key to get the threads for. If not provided, all threads for
   * the project will be returned.
   */
  contextKey?: string;
}

interface UseTamboThreadListConfig {
  /**
   * The projectId to get the threads for. If not provided, the current project
   * will be used.
   */
  projectId?: string;
  /**
   * The context key to get the threads for. If not provided, all threads for
   * the project will be returned.
   */
  contextKey?: string;
}

/**
 * Get all the threads for the specified project.
 *
 * If contextKey is empty, then all threads for the project will be returned.
 * If contextKey is not empty, then only the threads for the specified context
 * key will be returned.
 * @param config - The config for the useTamboThreadList hook
 * @param config.projectId - The projectId to get the threads for
 * @param config.contextKey - The context key to get the threads for
 * @returns The threads for the specified project and optional context key
 */
export function useTamboThreadList(
  { projectId: projectIdProp, contextKey }: UseTamboThreadListConfig = {},
  options: Partial<
    UseQueryOptions<TamboAI.Beta.Threads.ThreadsOffsetAndLimit | null>
  > = {},
) {
  const client = useTamboClient();
  const {
    projectId: contextProjectId,
    isLoading: isProjectLoading,
    error: projectError,
  } = useTamboProject();

  // Use provided projectId or fallback to context projectId
  const currentProjectId = projectIdProp ?? contextProjectId;

  const threadState = useTamboQuery({
    ...options,
    enabled: !!currentProjectId && !isProjectLoading,
    queryKey: ["threads", currentProjectId, contextKey],
    queryFn: async () => {
      if (!currentProjectId) {
        return null;
      }
      const threadIter = await client.beta.threads.list(currentProjectId, {
        contextKey,
      });
      return threadIter;
    },
  });

  // If we're still loading the project ID, return loading state
  if (isProjectLoading && !projectIdProp) {
    return {
      data: null,
      isLoading: true,
      error: null,
      isError: false,
      isSuccess: false,
      refetch: threadState.refetch,
    };
  }

  // If there was an error loading the project ID, return error state
  if (projectError && !projectIdProp) {
    return {
      data: null,
      isLoading: false,
      error: projectError,
      isError: true,
      isSuccess: false,
      refetch: threadState.refetch,
    };
  }

  return threadState;
}
