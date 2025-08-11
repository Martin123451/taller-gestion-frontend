import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { useApp } from '../../contexts/AppContext';
import { User } from '../../lib/types';
import { createUser, updateUser, deleteUser, getUsers, updateUserPassword } from '../../services/users';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDialogDesc, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../components/ui/alert-dialog';

/**
 * Traduce el rol de un usuario a un formato legible.
 * @param role - El rol a traducir ('admin' o 'mechanic').
 * @returns El rol en español.
 */
const translateRole = (role: string): string => {
  switch (role) {
    case 'admin':
      return 'Administrador';
    case 'mechanic':
      return 'Mecánico';
    default:
      return role;
  }
};

export default function UserManagement() {
  const { state, dispatch } = useApp();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'mechanic' as UserRole });

  useEffect(() => {
    const fetchUsers = async () => {
      const users = await getUsers();
      dispatch({ type: 'SET_USERS', payload: users });
    };
    fetchUsers();
  }, [dispatch]);

  const handleOpenDialog = (user: User | null = null) => {
    setEditingUser(user);
    if (user) {
      setFormData({ name: user.name, email: user.email, password: '', role: user.role });
    } else {
      setFormData({ name: '', email: '', password: '', role: 'mechanic' });
    }
    setIsDialogOpen(true);
  };

  const handleSaveUser = async () => {
    try {
      if (editingUser) {
        await updateUser(editingUser.id, { name: formData.name, email: formData.email, role: formData.role });
        if (formData.password) {
          await updateUserPassword(editingUser.id, formData.password);
        }
      } else {
        if (!formData.password) {
          alert("La contraseña es obligatoria para nuevos usuarios.");
          return;
        }
        await createUser(formData);
      }

      const users = await getUsers();
      dispatch({ type: 'SET_USERS', payload: users });
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error guardando el usuario:", error);
      if (error instanceof Error) {
        alert(`Error: ${error.message}`);
      } else {
        alert(`Un error desconocido ocurrió.`);
      }
    }
  };

  const handleDeleteUser = async (uid: string) => {
    try {
      await deleteUser(uid);
      const users = await getUsers();
      dispatch({ type: 'SET_USERS', payload: users });
    } catch (error) {
      console.error("Error eliminando el usuario:", error);
      if (error instanceof Error) {
        alert(`Error: ${error.message}`);
      } else {
        alert(`Un error desconocido ocurrió.`);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Usuarios</CardTitle>
        <CardDescription>Crear, editar y eliminar usuarios del sistema.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end mb-4">
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{translateRole(user.role)}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleOpenDialog(user)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDesc>
                          Esta acción no se puede deshacer. Se eliminará el usuario de forma permanente.
                        </AlertDialogDesc>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar' : 'Crear'} Usuario</DialogTitle>
            <DialogDescription>
              Completa los datos para el nuevo usuario o modifica los existentes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder={editingUser ? 'Dejar en blanco para no cambiar' : ''} />
            </div>
            <div>
              <Label htmlFor="role">Rol</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="mechanic">Mecánico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSaveUser} className="w-full">{editingUser ? 'Guardar Cambios' : 'Crear Usuario'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}