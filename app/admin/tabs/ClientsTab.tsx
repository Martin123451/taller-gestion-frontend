import React, { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../../components/ui/alert-dialog';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Textarea } from '../../../components/ui/textarea';
import { useApp } from '../../../contexts/AppContext';
import { Client } from '../../../lib/types';
import { Edit, Plus, Trash2 } from 'lucide-react';

interface ClientsTabProps {
  onNewClientClick: () => void;
}

export const ClientsTab = ({ onNewClientClick }: ClientsTabProps) => {
    const { state, dispatch } = useApp();
    const [editingClient, setEditingClient] = useState<Client | null>(null);

    const handleUpdateClient = () => {
        if (editingClient) {
            dispatch({ type: 'UPDATE_CLIENT', payload: editingClient });
            setEditingClient(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3>Gestión de Clientes</h3>
                <Button onClick={onNewClientClick}><Plus className="h-4 w-4 mr-2" />Nuevo Cliente</Button>
            </div>
            <Card>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Teléfono</TableHead>
                                <TableHead>Bicicletas</TableHead>
                                <TableHead className="text-center">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {state.clients.map(client => {
                                const clientBicycles = state.bicycles.filter(b => b.clientId === client.id);
                                return (
                                    <TableRow key={client.id}>
                                        <TableCell>{client.name}</TableCell>
                                        <TableCell>{client.email}</TableCell>
                                        <TableCell>{client.phone}</TableCell>
                                        <TableCell>{clientBicycles.length}</TableCell>
                                        <TableCell className="text-center space-x-2">
                                            <Button variant="outline" size="sm" onClick={() => setEditingClient(client)}><Edit className="h-4 w-4" /></Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará el cliente y sus bicicletas asociadas.</AlertDialogDescription></AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => dispatch({ type: 'DELETE_CLIENT', payload: client.id })}>Eliminar</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={!!editingClient} onOpenChange={(isOpen) => !isOpen && setEditingClient(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Editar Cliente</DialogTitle></DialogHeader>
                    {editingClient && (
                        <div className="space-y-4 pt-4">
                            <div><Label>Nombre Completo</Label><Input value={editingClient.name} onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })} /></div>
                            <div><Label>Email</Label><Input type="email" value={editingClient.email} onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })} /></div>
                            <div><Label>Teléfono</Label><Input value={editingClient.phone} onChange={(e) => setEditingClient({ ...editingClient, phone: e.target.value })} /></div>
                            <div><Label>Dirección</Label><Textarea value={editingClient.address || ''} onChange={(e) => setEditingClient({ ...editingClient, address: e.target.value })} /></div>
                            <Button onClick={handleUpdateClient} className="w-full">Guardar Cambios</Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};