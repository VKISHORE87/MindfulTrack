import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  profilePicture?: string;
  [key: string]: any; // Allow for any additional properties
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  refreshUser: () => void;
}

const UserContext = createContext<UserContextType>({
  user: null,
  isLoading: false,
  error: null,
  refreshUser: () => {}
});

export const useUser = () => useContext(UserContext);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const {
    data: user,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
    refetchOnWindowFocus: false,
  });

  const refreshUser = () => {
    refetch();
  };

  return (
    <UserContext.Provider
      value={{
        user: user || { id: 1, name: "Test User", email: "test@example.com" }, // Default to test user if not authenticated
        isLoading,
        error: error as Error | null,
        refreshUser
      }}
    >
      {children}
    </UserContext.Provider>
  );
}