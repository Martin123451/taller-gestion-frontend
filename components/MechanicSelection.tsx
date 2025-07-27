import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useApp } from '../contexts/AppContext';
import { User } from '../lib/types';
import { ArrowLeft } from 'lucide-react';

interface MechanicSelectionProps {
  onLogin: (email: string, pass: string) => void;
  onBack: () => void;
}

export default function MechanicSelection({ onLogin, onBack }: MechanicSelectionProps) {
  const { state } = useApp();
  const mechanics = state.users.filter((user: User) => user.role === 'mechanic');

  return (
    <Card className="w-full max-w-md shadow-2xl border-0">
      <CardHeader className="text-center relative">
        <Button variant="ghost" size="icon" className="absolute left-4 top-4" onClick={onBack}>
          <ArrowLeft />
        </Button>
        <CardTitle className="text-2xl pt-2">Seleccionar Mecánico</CardTitle>
        <CardDescription>¿Quién está iniciando turno?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {mechanics.map((mechanic) => (
          <Button 
            key={mechanic.id}
            onClick={() => onLogin(mechanic.email, 'password')} // Usamos una contraseña genérica para el mock
            className="w-full h-14 bg-marchant-red hover:bg-marchant-red-dark text-white text-lg shadow-lg hover:shadow-xl transition-all duration-200"
            size="lg"
          >
            <div className="flex items-center justify-center space-x-3">
              <span className="text-2xl">🔧</span>
              <div className="text-left">
                <div>{mechanic.name}</div>
              </div>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}