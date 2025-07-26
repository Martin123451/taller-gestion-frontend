import React from 'react';
import { Button } from './ui/button';
import { LogOut, Menu, User, Settings } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Avatar, AvatarFallback } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useAuth } from '../contexts/AppContext';
import KanbanBoard from './KanbanBoard';
import AdminDashboard from './AdminDashboard';
import marchantBikeLogo from 'figma:asset/38a2b67a52edeca0685a33b774485cbda0e44d59.png';

export default function Layout() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const isMechanic = user.role === 'mechanic';

  const Header = () => (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 items-center px-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <img src={marchantBikeLogo} alt="Marchant Bike" className="h-10 w-auto" />
            <div className="absolute -inset-1 bg-gradient-to-r from-marchant-green to-marchant-red rounded-full opacity-20 blur-sm"></div>
          </div>
          <div>
            <h1 className="text-xl text-marchant-green">Marchant Bike</h1>
            <p className="text-sm text-muted-foreground">
              {isMechanic ? 'Panel Mecánico' : 'Panel Administrador'}
            </p>
          </div>
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-4">
          <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-full bg-gradient-to-r from-marchant-green-light to-marchant-red-light">
            <div className={`w-2 h-2 rounded-full ${isMechanic ? 'bg-marchant-red' : 'bg-marchant-green'}`}></div>
            <span className="text-sm text-muted-foreground">
              {isMechanic ? 'Modo Mecánico' : 'Modo Administrador'}
            </span>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full border-2 border-transparent hover:border-marchant-green transition-colors">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className={`text-sm text-white ${isMechanic ? 'bg-marchant-red' : 'bg-marchant-green'}`}>
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isMechanic ? 'bg-marchant-red' : 'bg-marchant-green'}`}></div>
                    <p className="text-xs text-muted-foreground">
                      {user.role === 'admin' ? 'Administrador' : 'Mecánico'}
                    </p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-marchant-red hover:text-marchant-red-dark">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-full">
        {isMechanic ? <KanbanBoard /> : <AdminDashboard />}
      </main>
    </div>
  );
}