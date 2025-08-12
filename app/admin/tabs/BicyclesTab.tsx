import React, { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../../components/ui/alert-dialog';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Textarea } from '../../../components/ui/textarea';
import { useApp } from '../../../contexts/AppContext';
import { Bicycle } from '../../../lib/types';
import { Edit, Plus, Trash2 } from 'lucide-react';

interface BicyclesTabProps {
  onNewBicycleClick: () => void;
}

export const BicyclesTab = ({ onNewBicycleClick }: BicyclesTabProps) => {
    const { state, dispatch } = useApp();
    const [editingBicycle, setEditingBicycle] = useState<Bicycle | null>(null);

    const handleUpdateBicycle = () => {
        if (editingBicycle) {
            dispatch({ type: 'UPDATE_BICYCLE', payload: editingBicycle });
            setEditingBicycle(null);
        }
    };

    const handleDeleteBicycle = (bicycleId: string) => {
        dispatch({ type: 'DELETE_BICYCLE', payload: bicycleId });
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3>Gestión de Bicicletas</h3>
                <Button onClick={onNewBicycleClick}><Plus className="h-4 w-4 mr-2" />Nueva Bicicleta</Button>
            </div>
            <Card>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Marca/Modelo</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Color</TableHead>
                                <TableHead>Año</TableHead>
                                <TableHead className="text-center">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {state.bicycles.map(bicycle => {
                                const client = state.clients.find(c => c.id === bicycle.clientId);
                                return (
                                    <TableRow key={bicycle.id}>
                                        <TableCell>{client?.name}</TableCell>
                                        <TableCell>{bicycle.brand} {bicycle.model}</TableCell>
                                        <TableCell><Badge variant="outline">{bicycle.type.charAt(0).toUpperCase() + bicycle.type.slice(1)}</Badge></TableCell>
                                        <TableCell>{bicycle.color}</TableCell>
                                        <TableCell>{bicycle.year}</TableCell>
                                        <TableCell className="text-center space-x-2">
                                            <Button variant="outline" size="sm" onClick={() => setEditingBicycle(bicycle)}><Edit className="h-4 w-4" /></Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                        <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará la bicicleta permanentemente.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteBicycle(bicycle.id)}>Eliminar</AlertDialogAction>
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

            <Dialog open={!!editingBicycle} onOpenChange={(isOpen) => !isOpen && setEditingBicycle(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Editar Bicicleta</DialogTitle></DialogHeader>
                    {editingBicycle && (
                        <div className="space-y-4 pt-4">
                            <div><Label>Cliente</Label><Select value={editingBicycle.clientId} onValueChange={(value) => setEditingBicycle({ ...editingBicycle, clientId: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{state.clients.map(client => (<SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>))}</SelectContent></Select></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label>Marca</Label><Input value={editingBicycle.brand} onChange={(e) => setEditingBicycle({ ...editingBicycle, brand: e.target.value })} /></div>
                                <div><Label>Modelo</Label><Input value={editingBicycle.model} onChange={(e) => setEditingBicycle({ ...editingBicycle, model: e.target.value })} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label>Tipo</Label><Select value={editingBicycle.type} onValueChange={(value: any) => setEditingBicycle({ ...editingBicycle, type: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="mountain">Montaña</SelectItem><SelectItem value="road">Ruta</SelectItem><SelectItem value="hybrid">Híbrida</SelectItem><SelectItem value="electric">Eléctrica</SelectItem><SelectItem value="bmx">BMX</SelectItem><SelectItem value="other">Otro</SelectItem></SelectContent></Select></div>
                                <div><Label>Color</Label><Input value={editingBicycle.color} onChange={(e) => setEditingBicycle({ ...editingBicycle, color: e.target.value })} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label>N° Serie</Label><Input value={editingBicycle.serialNumber || ''} onChange={(e) => setEditingBicycle({ ...editingBicycle, serialNumber: e.target.value })}/></div>
                                <div><Label>Año</Label><Input type="number" value={editingBicycle.year} onChange={(e) => setEditingBicycle({ ...editingBicycle, year: parseInt(e.target.value) })} onWheel={(e) => e.currentTarget.blur()}/></div>
                            </div>
                            <div><Label>Notas</Label><Textarea value={editingBicycle.notes || ''} onChange={(e) => setEditingBicycle({ ...editingBicycle, notes: e.target.value })} /></div>
                            <Button onClick={handleUpdateBicycle} className="w-full">Guardar Cambios</Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};