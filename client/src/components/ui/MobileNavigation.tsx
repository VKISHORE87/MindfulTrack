import { Link } from "wouter";
import {
  Home,
  FileText,
  BarChart2,
  TrendingUp,
  User,
  Dumbbell
} from "lucide-react";

interface MobileNavigationProps {
  currentRoute: string;
}

export default function MobileNavigation({ currentRoute }: MobileNavigationProps) {
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: <Home className="h-6 w-6" /> },
    { href: '/assessment', label: 'Assessment', icon: <FileText className="h-6 w-6" /> },
    { href: '/practice', label: 'Practice', icon: <Dumbbell className="h-6 w-6" /> },
    { href: '/progress', label: 'Progress', icon: <TrendingUp className="h-6 w-6" /> },
    { href: '/profile', label: 'Profile', icon: <User className="h-6 w-6" /> },
  ];

  return (
    <nav className="md:hidden bg-white border-t border-gray-200 fixed bottom-0 w-full">
      <div className="flex justify-around">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <a 
              className={`flex flex-col items-center py-2 px-3 ${
                currentRoute === item.href || 
                (item.href === '/dashboard' && currentRoute === '/') 
                  ? 'text-primary' 
                  : 'text-gray-500'
              }`}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.label}</span>
            </a>
          </Link>
        ))}
      </div>
    </nav>
  );
}
