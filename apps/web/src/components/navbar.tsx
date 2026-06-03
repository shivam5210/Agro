import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, LogOut, Users, ShieldCheck, Truck, BarChart3, DollarSign, MapPin, UsersRound } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/fpo-directory', label: 'FPO Directory', icon: UsersRound },
    { href: '/buyers', label: 'Buyers', icon: Users },
    { href: '/logistics', label: 'Logistics', icon: Truck },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <nav className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center space-x-3">
              <span className="h-8 w-8 flex-shrink-0">
                <svg className="h-8 w-8 text-green-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/>
                  <path d="M2 12C2 7.59 4.41 4 8.83 4H15.17C19.59 4 22 7.59 22 12C22 16.41 19.59 20 15.17 20H8.83C4.41 20 2 16.41 2 12Z" fill="currentColor" opacity="0.2"/>
                </svg>
              </span>
              <span className="text-xl font-bold text-green-600">FPO MarketLink</span>
            </Link>
          </div>
          <div className="hidden md:flex md:items-center md:space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 text-sm font-medium text-gray-500 hover:text-gray-900 ${pathname === item.href ? 'text-green-600 border-b-2 border-green-600' : ''}`}
              >
                {item.icon && (
                  <span className="h-4 w-4 text-green-600">{item.icon}</span>
                )}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
          <div className="flex items-center space-x-4">
            {/* Authentication placeholder - in real app, this would show user info */}
            <div className="relative">
              <button className="flex items-center space-x-2 text-sm font-medium text-gray-500 hover:text-gray-900">
                <span className="h-6 w-6 flex-shrink-0">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 006 0zm6 2a9 9 0 11-18 0 9 9 0 0018 0z"/>
                  </svg>
                </span>
                <span>Admin</span>
                <span className="ml-1">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}