"use client";
import React, { createContext, PropsWithChildren, useContext } from "react";
import { useTamboClient } from "./tambo-client-provider";
import { useTamboQuery } from "../hooks/react-query-hooks";

export interface TamboProjectProviderProps {
  /**
   * Optional project ID to use. If provided, no API call will be made.
   * If not provided, the current project will be fetched from the API.
   */
  projectId?: string;
}

export interface TamboProjectContextProps {
  /** The current project ID */
  projectId: string | undefined;
  /** Whether the project ID is currently being fetched */
  isLoading: boolean;
  /** Any error that occurred while fetching the project ID */
  error: Error | null;
}

const TamboProjectContext = createContext<TamboProjectContextProps | undefined>(
  undefined,
);

/**
 * The TamboProjectProvider manages project ID state for the application.
 * If a projectId is provided as a prop, it uses that directly without making API calls.
 * If no projectId is provided, it fetches the current project from the API once and caches it.
 * @param props - The props for the TamboProjectProvider
 * @param props.children - The children to wrap
 * @param props.projectId - Optional project ID to use instead of fetching from API
 * @returns The TamboProjectProvider component
 */
export const TamboProjectProvider: React.FC<
  PropsWithChildren<TamboProjectProviderProps>
> = ({ children, projectId: projectIdProp }) => {
  const client = useTamboClient();

  // If user provides projectId, use it directly (no API call)
  const shouldFetchFromApi = !projectIdProp;

  const {
    data: fetchedProjectId,
    isLoading,
    error,
  } = useTamboQuery({
    queryKey: ["projectId"],
    queryFn: async () => {
      const project = await client.beta.projects.getCurrent();
      return project.id;
    },
    enabled: shouldFetchFromApi,
  });

  // Use provided projectId or fallback to fetched projectId
  const resolvedProjectId = projectIdProp ?? fetchedProjectId;

  const contextValue: TamboProjectContextProps = {
    projectId: resolvedProjectId,
    isLoading: shouldFetchFromApi ? isLoading : false,
    error: shouldFetchFromApi ? error : null,
  };

  return (
    <TamboProjectContext.Provider value={contextValue}>
      {children}
    </TamboProjectContext.Provider>
  );
};

/**
 * Hook to access the current project ID and related state.
 * Must be used within a TamboProjectProvider.
 * @returns The project context containing projectId, isLoading, and error
 */
export const useTamboProject = (): TamboProjectContextProps => {
  const context = useContext(TamboProjectContext);

  if (context === undefined) {
    throw new Error(
      "useTamboProject must be used within a TamboProjectProvider",
    );
  }

  return context;
};
