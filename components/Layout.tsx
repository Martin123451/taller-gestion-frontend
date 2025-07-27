import React from 'react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Avatar, AvatarFallback } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useAuth } from '../contexts/AppContext';
import KanbanBoard from './KanbanBoard';
import AdminDashboard from './AdminDashboard';
import marchantBikeLogo from "../assets/logo.png";
import { LogOut, Menu, User, Settings, ArrowLeft } from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const isMechanic = user.role === 'mechanic';

  const Header = () => (
  <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
    <div className="container flex h-16 items-center px-4">

      {/* BOTÓN PARA VOLVER AÑADIDO */}
      <Button variant="ghost" size="icon" className="mr-4" onClick={logout}>
        <ArrowLeft className="h-5 w-5" />
        <span className="sr-only">Volver</span>
      </Button>

      <div className="flex items-center space-x-4">
        <div className="relative">
          {/* Hemos reemplazado la ruta de figma por la local */}
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
        {/* El resto del header no cambia... */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-full bg-gradient-to-r from-marchant-green-light to-marchant-red-light">
          <div className={`w-2 h-2 rounded-full ${isMechanic ? 'bg-marchant-red' : 'bg-marchant-green'}`}></div>
          <span className="text-sm text-muted-foreground">
            {isMechanic ? 'Modo Mecánico' : 'Modo Administrador'}
          </span>
        </div>

        <DropdownMenu>
          {/* ... El resto del DropdownMenu ... */}
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