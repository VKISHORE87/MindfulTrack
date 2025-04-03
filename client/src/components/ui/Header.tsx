import { Bell, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout', {});
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
      setLocation('/login');
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was an error logging out",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="px-4 py-3 md:hidden flex items-center justify-between">
        <button type="button" className="text-gray-500 hover:text-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center">
          <div className="bg-primary text-white p-1.5 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h1 className="ml-2 text-lg font-bold">SkillPath</h1>
        </div>
        <button type="button" className="text-gray-500 hover:text-gray-700">
          <Bell className="h-6 w-6" />
        </button>
      </div>
      
      <div className="hidden md:flex items-center justify-between px-6 py-3">
        <h1 className="text-xl font-bold">{title}</h1>
        <div className="flex items-center space-x-4">
          <button type="button" className="text-gray-500 hover:text-gray-700 relative">
            <Bell className="h-6 w-6" />
            <span className="absolute top-0 right-0 block w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <Button variant="ghost" size="icon">
            <Settings className="h-6 w-6" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
