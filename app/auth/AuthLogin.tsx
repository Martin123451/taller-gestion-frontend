import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { useAuth } from '../../contexts/AppContext';
import marchantBikeLogo from '../../assets/logo.png'; // Asegúrate que la ruta al logo sea correcta
import MechanicSelection from '../mechanic/MechanicSelection'; // Importamos el nuevo componente

export default function AuthLogin() {
  const { login } = useAuth();
  const [view, setView] = useState<'role' | 'mechanic'>('role');

  const handleAdminLogin = () => {
    // Creamos un usuario admin genérico para el login, sin consultar la base de datos.
    const adminUser: User = {
      id: 'admin-virtual-01',
      name: 'Administrador',
      email: 'admin@taller.com',
      role: 'admin',
      createdAt: new Date()
    };
    login(adminUser);
  };

  if (view === 'mechanic') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-marchant-green-light to-marchant-red-light p-4">
        <MechanicSelection onLogin={login} onBack={() => setView('role')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-marchant-green-light to-marchant-red-light p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <img src={marchantBikeLogo} alt="Marchant Bike" className="h-20 w-auto" />
              <div className="absolute -inset-2 bg-gradient-to-r from-marchant-green to-marchant-red rounded-full opacity-20 blur-lg"></div>
            </div>
          </div>
          <CardTitle className="text-2xl text-marchant-green">Marchant Bike</CardTitle>
          <CardDescription className="text-lg">Sistema de Gestión de Taller</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center mb-6">
            <p className="text-muted-foreground">Selecciona tu rol para acceder al sistema</p>
          </div>

          <Button 
            onClick={handleAdminLogin}
            className="w-full h-14 bg-marchant-green hover:bg-marchant-green-dark text-white text-lg shadow-lg hover:shadow-xl transition-all duration-200"
            size="lg"
          >
            <div className="flex items-center justify-center space-x-3">
              <span className="text-2xl">👨‍💼</span>
              <div className="text-left">
                <div>Administrador</div>
                <div className="text-sm opacity-90">Panel completo de gestión</div>
              </div>
            </div>
          </Button>

          <Button 
            onClick={() => setView('mechanic')} // Cambiamos la acción para mostrar el selector
            className="w-full h-14 bg-marchant-red hover:bg-marchant-red-dark text-white text-lg shadow-lg hover:shadow-xl transition-all duration-200"
            size="lg"
          >
            <div className="flex items-center justify-center space-x-3">
              <span className="text-2xl">🔧</span>
              <div className="text-left">
                <div>Mecánico</div>
                <div className="text-sm opacity-90">Tablero de trabajo</div>
              </div>
            </div>
          </Button>

          <div className="mt-8 pt-4 border-t text-center">
            <p className="text-xs text-muted-foreground">
              Sistema de gestión para talleres de bicicletas
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}