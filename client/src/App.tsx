import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Assessment from "@/pages/assessment";
import LearningPath from "@/pages/learning-path";
import Resources from "@/pages/resources";
import Progress from "@/pages/progress";
import Validation from "@/pages/validation";
import Profile from "@/pages/profile";
import Practice from "@/pages/practice";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import Sidebar from "@/components/ui/Sidebar";
import MobileNavigation from "@/components/ui/MobileNavigation";
import Header from "@/components/ui/Header";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";

interface ProtectedRouteProps {
  component: React.ComponentType<any>;
  [key: string]: any;
}

function ProtectedRoute({ component: Component, ...rest }: ProtectedRouteProps) {
  const { data: user, isLoading, error, isError } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
    staleTime: 0, // Always refetch
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });
  
  const [location, setLocation] = useLocation();
  
  useEffect(() => {
    if (!isLoading && (isError || !user)) {
      console.log("Protected route - Auth failed:", { isError, error });
      setLocation("/login");
    }
  }, [user, isLoading, isError, error, setLocation]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) return null;
  
  return <Component {...rest} user={user} />;
}

interface AppLayoutProps {
  children: ReactNode;
  hideNavigation?: boolean;
}

function AppLayout({ children, hideNavigation = false }: AppLayoutProps) {
  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
  
  const [location] = useLocation();
  
  // Log authentication status for debugging
  useEffect(() => {
    if (location !== '/login' && location !== '/register' && 
        location !== '/forgot-password' && location !== '/reset-password') {
      console.log("AppLayout authentication status:", user ? "Authenticated" : "Not authenticated");
    }
  }, [user, location]);
  
  // Don't show navigation on login/register pages
  if (hideNavigation) {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {user && <Sidebar user={user} currentRoute={location} />}
      <main className="flex-1 overflow-auto">
        {user && <Header title={getPageTitle(location)} />}
        {children}
      </main>
      {user && <MobileNavigation currentRoute={location} />}
    </div>
  );
}

function getPageTitle(path: string): string {
  const pathSegment = path.split('/')[1] || 'dashboard';
  const titles: Record<string, string> = {
    'dashboard': 'Dashboard',
    'assessment': 'Skill Assessment',
    'learning-path': 'Learning Path',
    'resources': 'Resources',
    'progress': 'Progress',
    'validation': 'Skill Validation',
    'practice': 'Practice Skills',
    'profile': 'My Profile'
  };
  
  return titles[pathSegment] || 'Dashboard';
}

function Router() {
  return (
    <Switch>
      <Route path="/login">
        <AppLayout hideNavigation={true}>
          <Login />
        </AppLayout>
      </Route>
      <Route path="/register">
        <AppLayout hideNavigation={true}>
          <Register />
        </AppLayout>
      </Route>
      <Route path="/forgot-password">
        <AppLayout hideNavigation={true}>
          <ForgotPassword />
        </AppLayout>
      </Route>
      <Route path="/reset-password">
        <AppLayout hideNavigation={true}>
          <ResetPassword />
        </AppLayout>
      </Route>
      <Route path="/">
        <AppLayout>
          <ProtectedRoute component={Dashboard} />
        </AppLayout>
      </Route>
      <Route path="/dashboard">
        <AppLayout>
          <ProtectedRoute component={Dashboard} />
        </AppLayout>
      </Route>
      <Route path="/assessment">
        <AppLayout>
          <ProtectedRoute component={Assessment} />
        </AppLayout>
      </Route>
      <Route path="/learning-path">
        <AppLayout>
          <ProtectedRoute component={LearningPath} />
        </AppLayout>
      </Route>
      <Route path="/resources">
        <AppLayout>
          <ProtectedRoute component={Resources} />
        </AppLayout>
      </Route>
      <Route path="/progress">
        <AppLayout>
          <ProtectedRoute component={Progress} />
        </AppLayout>
      </Route>
      <Route path="/validation">
        <AppLayout>
          <ProtectedRoute component={Validation} />
        </AppLayout>
      </Route>
      <Route path="/profile">
        <AppLayout>
          <ProtectedRoute component={Profile} />
        </AppLayout>
      </Route>
      <Route path="/practice">
        <AppLayout>
          <ProtectedRoute component={Practice} />
        </AppLayout>
      </Route>
      <Route>
        <AppLayout hideNavigation={true}>
          <NotFound />
        </AppLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
