import React, { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../../components/ui/alert-dialog';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Textarea } from '../../../components/ui/textarea';
import { useApp } from '../../../contexts/AppContext';
import { WorkOrder, WorkOrderStatus } from '../../../lib/types';
import { Edit, Plus, Trash2 } from 'lucide-react';

const dateFromInput = (dateString: string): Date => {
    if (!dateString) return new Date();
    return new Date(dateString + 'T12:00:00');
};

const translateStatus = (status: WorkOrderStatus) => {
    const statuses: Record<WorkOrderStatus, string> = {
        open: 'Abierta',
        in_progress: 'En Progreso',
        ready_for_delivery: 'Lista para Entrega',
        completed: 'Finalizada',
    };
    return statuses[status] || status;
};

interface WorkOrdersTabProps {
  onNewWorkOrderClick: () => void;
}

export const WorkOrdersTab = ({ onNewWorkOrderClick }: WorkOrdersTabProps) => {
    const { state, dispatch } = useApp();
    const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrder | null>(null);

    const handleUpdateWorkOrder = () => {
        if (editingWorkOrder) {
            dispatch({ type: 'UPDATE_WORK_ORDER', payload: editingWorkOrder });
            setEditingWorkOrder(null);
        }
    };

    const handleDeleteWorkOrder = (workOrderId: string) => {
        dispatch({ type: 'DELETE_WORK_ORDER', payload: workOrderId });
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3>Gestión de Fichas de Trabajo</h3>
                <Button onClick={onNewWorkOrderClick}><Plus className="h-4 w-4 mr-2" />Nueva Ficha</Button>
            </div>
            <Card>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Bicicleta</TableHead>
                                <TableHead>Fecha Ingreso</TableHead>
                                <TableHead>Fecha Entrega Est.</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-center">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {state.workOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(workOrder => (
                                <TableRow key={workOrder.id}>
                                    <TableCell>#{workOrder.id.slice(-6)}</TableCell>
                                    <TableCell>{workOrder.client.name}</TableCell>
                                    <TableCell>{workOrder.bicycle.brand} {workOrder.bicycle.model}</TableCell>
                                    <TableCell>{new Date(workOrder.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell>{workOrder.estimatedDeliveryDate ? new Date(workOrder.estimatedDeliveryDate).toLocaleDateString() : 'N/A'}</TableCell>
                                    <TableCell><Badge variant="outline">{translateStatus(workOrder.status)}</Badge></TableCell>
                                    <TableCell className="text-center space-x-2">
                                        <Button variant="outline" size="sm" onClick={() => setEditingWorkOrder(workOrder)}><Edit className="h-4 w-4" /></Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                    <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará la ficha de trabajo permanentemente.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteWorkOrder(workOrder.id)}>Eliminar</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={!!editingWorkOrder} onOpenChange={(isOpen) => !isOpen && setEditingWorkOrder(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>Editar Ficha de Trabajo</DialogTitle></DialogHeader>
                    {editingWorkOrder && (
                        <div className="space-y-4 pt-4">
                            <div><Label>Descripción</Label><Textarea value={editingWorkOrder.description} onChange={(e) => setEditingWorkOrder({ ...editingWorkOrder, description: e.target.value })} /></div>
                            <div><Label>Fecha Entrega Estimada</Label><Input type="date" value={editingWorkOrder.estimatedDeliveryDate ? new Date(editingWorkOrder.estimatedDeliveryDate).toISOString().split('T')[0] : ''} onChange={(e) => setEditingWorkOrder({ ...editingWorkOrder, estimatedDeliveryDate: dateFromInput(e.target.value) })} /></div>
                            <Button onClick={handleUpdateWorkOrder} className="w-full">Guardar Cambios</Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};