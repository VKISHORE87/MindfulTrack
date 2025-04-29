import { Link } from "wouter";
import { User } from "@shared/schema";
import {
  Home,
  FileText,
  BarChart2,
  BookOpen,
  TrendingUp,
  CheckCircle,
  LightbulbIcon,
  Dumbbell
} from "lucide-react";

interface SidebarProps {
  user: Omit<User, 'password'>;
  currentRoute: string;
}

export default function Sidebar({ user, currentRoute }: SidebarProps) {
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: <Home className="h-5 w-5 mr-3" /> },
    { href: '/assessment', label: 'Assessment', icon: <FileText className="h-5 w-5 mr-3" /> },
    { href: '/assessment-new', label: 'Target Role Assessment', icon: <FileText className="h-5 w-5 mr-3" /> },
    { href: '/learning-path', label: 'Learning Path', icon: <BarChart2 className="h-5 w-5 mr-3" /> },
    { href: '/resources', label: 'Resources', icon: <BookOpen className="h-5 w-5 mr-3" /> },
    { href: '/practice', label: 'Practice', icon: <Dumbbell className="h-5 w-5 mr-3" /> },
    { href: '/progress', label: 'Progress', icon: <TrendingUp className="h-5 w-5 mr-3" /> },
    { href: '/validation', label: 'Validation', icon: <CheckCircle className="h-5 w-5 mr-3" /> },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="bg-primary text-white p-2 rounded-lg">
            <LightbulbIcon className="h-6 w-6" />
          </div>
          <h1 className="ml-2 text-xl font-bold">Upcraft</h1>
        </div>
      </div>
      
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div 
              className={`flex items-center px-4 py-2 rounded-lg cursor-pointer ${
                currentRoute === item.href || 
                (item.href === '/dashboard' && currentRoute === '/') 
                  ? 'text-gray-900 bg-gray-100' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item.icon}
              {item.label}
            </div>
          </Link>
        ))}
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <Link href="/profile">
          <div className="flex items-center cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-gray-500">{user.role || 'User'}</p>
            </div>
          </div>
        </Link>
      </div>
    </aside>
  );
}
