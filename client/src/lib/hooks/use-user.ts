import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  profilePicture?: string;
  [key: string]: any; // Allow for any additional properties
}

export function useUser() {
  // Temporarily use the mock user for development purposes
  // In a production environment, this would fetch from the API
  const mockUser = {
    id: 1,
    username: "demo_user",
    name: "Demo User",
    email: "demo@example.com",
    role: "user",
    createdAt: new Date(),
    googleId: null,
    profilePicture: null,
    resetPasswordToken: null,
    resetPasswordExpires: null
  };

  return {
    user: mockUser,
    isLoading: false,
    error: null,
    refreshUser: () => {}
  };
}