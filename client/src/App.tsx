import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Assessment from "@/pages/assessment";
import AssessmentNew from "@/pages/assessment-new";
import LearningPath from "@/pages/learning-path";
import CareerPlan from "@/pages/career-plan";
import Resources from "@/pages/resources";
import Progress from "@/pages/progress";
import Validation from "@/pages/validation";
import Profile from "@/pages/profile";
import Practice from "@/pages/practice";
import CareerTransitions from "@/pages/career-transitions";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import Sidebar from "@/components/ui/Sidebar";
import MobileNavigation from "@/components/ui/MobileNavigation";
import Header from "@/components/ui/Header";
import { useQuery } from "@tanstack/react-query";
import React, { useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";

// Create a simple Redirect component for redirecting routes
function Redirect({ to }: { to: string }) {
  const [, navigate] = useLocation();
  
  // Perform navigation immediately
  useEffect(() => {
    navigate(to);
  }, [navigate, to]);
  
  return null;
}

interface ProtectedRouteProps {
  component: React.ComponentType<any>;
  [key: string]: any;
}

// Mock user for development
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

function ProtectedRoute({ component: Component, ...rest }: ProtectedRouteProps) {
  // Using mockUser instead of making API calls
  const user = mockUser;
  
  // No loading state needed
  return <Component {...rest} user={user} />;
}

interface AppLayoutProps {
  children: ReactNode;
  hideNavigation?: boolean;
}

function AppLayout({ children, hideNavigation = false }: AppLayoutProps) {
  // Using mockUser instead of fetching
  const user = mockUser;
  
  const [location] = useLocation();
  
  // Don't show navigation on login/register pages
  if (hideNavigation) {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      <Sidebar user={user} currentRoute={location} />
      <main className="flex-1 overflow-auto">
        <Header title={getPageTitle(location)} />
        {children}
      </main>
      <MobileNavigation currentRoute={location} />
    </div>
  );
}

function getPageTitle(path: string): string {
  const pathSegment = path.split('/')[1] || 'dashboard';
  const titles: Record<string, string> = {
    'dashboard': 'Dashboard',
    'career-plan': 'Career Plan',
    'resources': 'Resources',
    'progress': 'Progress',
    'validation': 'Skill Validation',
    'practice': 'Practice Skills',
    'career-transitions': 'Career Options',
    'profile': 'My Profile'
  };
  
  return titles[pathSegment] || 'Dashboard';
}

function Router() {
  return (
    <Switch>
      {/* Direct routes to dashboard - no login needed */}
      <Route path="/login">
        <Redirect to="/dashboard" />
      </Route>
      <Route path="/register">
        <Redirect to="/dashboard" />
      </Route>
      <Route path="/forgot-password">
        <Redirect to="/dashboard" />
      </Route>
      <Route path="/reset-password">
        <Redirect to="/dashboard" />
      </Route>
      
      {/* Main application routes */}
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
        <Redirect to="/dashboard" />
      </Route>
      <Route path="/assessment-new">
        <Redirect to="/dashboard" />
      </Route>
      <Route path="/learning-path">
        <Redirect to="/dashboard" />
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
      <Route path="/career-transitions">
        <AppLayout>
          <ProtectedRoute component={CareerTransitions} />
        </AppLayout>
      </Route>
      <Route path="/career-plan">
        <AppLayout>
          <ProtectedRoute component={CareerPlan} />
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
