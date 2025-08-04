import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { useApp } from '../../contexts/AppContext';
import { Client, Bicycle, WorkOrder, WorkOrderStatus } from '../../lib/types';
import InventoryManagement from './InventoryManagement';
import ClientSearchCombobox from '../../components/ClientSearchCombobox';
import { createClient } from '../../services/clients';
import { createBicycle } from '../../services/bicycles';
import { createWorkOrder } from '../../services/workOrders';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../components/ui/alert-dialog';
import { Users, Bike, FileText, Plus, Edit, CheckCircle2, Truck, BarChart3, Download, Trash2 } from 'lucide-react';

// --- SUB-COMPONENTES DE FORMULARIOS (Definidos fuera para estabilidad) ---

const NewClientForm = ({ closeModal, onClientCreated }: { closeModal: () => void, onClientCreated: (newClient: Client) => void }) => {
    const { dispatch } = useApp();
    const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', address: '' });

    const handleAddClient = async () => {
        const clientData = { ...newClient, createdAt: new Date(), updatedAt: new Date() };
        const createdClient = await createClient(clientData);
        dispatch({ type: 'ADD_CLIENT', payload: createdClient });
        onClientCreated(createdClient);
        closeModal();
    };
    
    return (
        <>
            <DialogHeader>
                <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
                <DialogDescription>Completa la información del cliente</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
                <div><Label htmlFor="name">Nombre Completo</Label><Input id="name" value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} placeholder="Juan Pérez" /></div>
                <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} placeholder="juan@email.com" /></div>
                <div><Label htmlFor="phone">Teléfono</Label><Input id="phone" value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} placeholder="+56912345678" /></div>
                <div><Label htmlFor="address">Dirección</Label><Textarea id="address" value={newClient.address || ''} onChange={(e) => setNewClient({ ...newClient, address: e.target.value })} placeholder="Dirección completa" /></div>
                <Button onClick={handleAddClient} className="w-full">Guardar Cliente</Button>
            </div>
        </>
    );
};

const NewBicycleForm = ({ closeModal, selectedClientId, onBicycleCreated }: { closeModal: () => void, selectedClientId: string, onBicycleCreated: (newBicycle: Bicycle) => void }) => {
    const { state, dispatch } = useApp();
    const [newBicycle, setNewBicycle] = useState({ clientId: selectedClientId || '', brand: '', model: '', type: 'mountain' as const, color: '', serialNumber: '', year: new Date().getFullYear(), notes: '' });
    
    const handleAddBicycle = async () => {
        const bicycleData = { ...newBicycle, createdAt: new Date(), updatedAt: new Date() };
        const createdBicycle = await createBicycle(bicycleData);
        dispatch({ type: 'ADD_BICYCLE', payload: createdBicycle });
        onBicycleCreated(createdBicycle);
        closeModal();
    };
    
    return (
        <>
            <DialogHeader><DialogTitle>Agregar Nueva Bicicleta</DialogTitle><DialogDescription>Registra una nueva bicicleta en el sistema</DialogDescription></DialogHeader>
            <div className="space-y-4 pt-4">
                <div><Label htmlFor="clientId">Cliente</Label><Select value={newBicycle.clientId} onValueChange={(value) => setNewBicycle({ ...newBicycle, clientId: value })}><SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger><SelectContent>{state.clients.map(client => (<SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>))}</SelectContent></Select></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><Label htmlFor="brand">Marca</Label><Input id="brand" value={newBicycle.brand} onChange={(e) => setNewBicycle({ ...newBicycle, brand: e.target.value })} placeholder="Trek, Giant, etc." /></div>
                    <div><Label htmlFor="model">Modelo</Label><Input id="model" value={newBicycle.model} onChange={(e) => setNewBicycle({ ...newBicycle, model: e.target.value })} placeholder="Marlin 7, Escape 3, etc." /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div><Label htmlFor="type">Tipo</Label><Select value={newBicycle.type} onValueChange={(value: any) => setNewBicycle({ ...newBicycle, type: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="mountain">Montaña</SelectItem><SelectItem value="road">Ruta</SelectItem><SelectItem value="hybrid">Híbrida</SelectItem><SelectItem value="electric">Eléctrica</SelectItem><SelectItem value="bmx">BMX</SelectItem><SelectItem value="other">Otro</SelectItem></SelectContent></Select></div>
                    <div><Label htmlFor="color">Color</Label><Input id="color" value={newBicycle.color} onChange={(e) => setNewBicycle({ ...newBicycle, color: e.target.value })} placeholder="Azul, Rojo, etc." /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div><Label htmlFor="serialNumber">Número de Serie</Label><Input id="serialNumber" value={newBicycle.serialNumber || ''} onChange={(e) => setNewBicycle({ ...newBicycle, serialNumber: e.target.value })} placeholder="Opcional" /></div>
                    <div><Label htmlFor="year">Año</Label><Input id="year" type="number" value={newBicycle.year} onChange={(e) => setNewBicycle({ ...newBicycle, year: parseInt(e.target.value) })} /></div>
                </div>
                <div><Label htmlFor="notes">Notas</Label><Textarea id="notes" value={newBicycle.notes || ''} onChange={(e) => setNewBicycle({ ...newBicycle, notes: e.target.value })} placeholder="Observaciones adicionales" /></div>
                <Button onClick={handleAddBicycle} className="w-full">Guardar Bicicleta</Button>
            </div>
        </>
    );
};

const NewWorkOrderForm = ({ closeModal, newWorkOrder, setNewWorkOrder, onShowAddClient, onShowAddBicycle }: {
    closeModal: () => void;
    newWorkOrder: any;
    setNewWorkOrder: (data: any) => void;
    onShowAddClient: () => void;
    onShowAddBicycle: () => void;
}) => {
    const { state, dispatch } = useApp();
    const handleAddWorkOrder = async () => {
        const client = state.clients.find(c => c.id === newWorkOrder.clientId);
        const bicycle = state.bicycles.find(b => b.id === newWorkOrder.bicycleId);
        if (client && bicycle) {
            const workOrderData = {
                ...newWorkOrder,
                status: 'open',
                services: [],
                parts: [],
                totalAmount: 0,
                estimatedDeliveryDate: newWorkOrder.estimatedDeliveryDate ? new Date(newWorkOrder.estimatedDeliveryDate) : null,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const createdWorkOrder = await createWorkOrder(workOrderData, client, bicycle);
            dispatch({ type: 'ADD_WORK_ORDER', payload: createdWorkOrder });
            closeModal();
        }
    };
    const availableBicycles = state.bicycles.filter(b => b.clientId === newWorkOrder.clientId);
    return (
        <>
            <DialogHeader><DialogTitle>Crear Nueva Ficha de Trabajo</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
                <div><Label htmlFor="clientId">Cliente</Label><ClientSearchCombobox selectedClientId={newWorkOrder.clientId} onSelectClient={(clientId) => setNewWorkOrder({ ...newWorkOrder, clientId, bicycleId: '' })} onAddNewClient={onShowAddClient} /></div>
                <div className="flex items-end gap-2">
                    <div className="flex-grow"><Label htmlFor="bicycleId">Bicicleta</Label><Select value={newWorkOrder.bicycleId} onValueChange={(value) => setNewWorkOrder({ ...newWorkOrder, bicycleId: value })} disabled={!newWorkOrder.clientId}><SelectTrigger><SelectValue placeholder="Seleccionar bicicleta" /></SelectTrigger><SelectContent>{availableBicycles.map(bicycle => (<SelectItem key={bicycle.id} value={bicycle.id}>{bicycle.brand} {bicycle.model} ({bicycle.color})</SelectItem>))}</SelectContent></Select></div>
                    <Button variant="outline" size="icon" onClick={onShowAddBicycle} disabled={!newWorkOrder.clientId}><Plus className="h-4 w-4" /></Button>
                </div>
                <div><Label htmlFor="description">Descripción del Problema</Label><Textarea id="description" value={newWorkOrder.description} onChange={(e) => setNewWorkOrder({...newWorkOrder, description: e.target.value})} /></div>
                <div><Label htmlFor="estimatedDeliveryDate">Fecha de Entrega Estimada</Label><Input id="estimatedDeliveryDate" type="date" value={newWorkOrder.estimatedDeliveryDate} onChange={(e) => setNewWorkOrder({...newWorkOrder, estimatedDeliveryDate: e.target.value})} /></div>
                <Button onClick={handleAddWorkOrder} className="w-full">Crear Ficha</Button>
            </div>
        </>
    );
};

// --- SUB-COMPONENTES DE PESTAÑAS (Ahora solo muestran información y abren modales) ---

const translateStatus = (status: WorkOrderStatus) => {
    switch (status) {
      case 'open': return 'Abierta';
      case 'in_progress': return 'En Progreso';
      case 'ready_for_delivery': return 'Lista para Entrega';
      case 'completed': return 'Finalizada';
      default: return status.replace(/_/g, ' ');
    }
};

const OverviewTab = ({ onNewWorkOrderClick }: { onNewWorkOrderClick: () => void }) => {
    const { state, dispatch } = useApp();
    const totalClients = state.clients.length;
    const totalBicycles = state.bicycles.length;
    const openWorkOrders = state.workOrders.filter(wo => wo.status === 'open').length;
    const readyForDelivery = state.workOrders.filter(wo => wo.status === 'ready_for_delivery').length;
    
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm">Clientes</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl">{totalClients}</div><p className="text-xs text-muted-foreground">Total registrados</p></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm">Bicicletas</CardTitle><Bike className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl">{totalBicycles}</div><p className="text-xs text-muted-foreground">En el sistema</p></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm">Fichas Abiertas</CardTitle><FileText className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl">{openWorkOrders}</div><p className="text-xs text-muted-foreground">Pendientes</p></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm">Para Entrega</CardTitle><Truck className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl">{readyForDelivery}</div><p className="text-xs text-muted-foreground">Listas</p></CardContent></Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div><CardTitle>Próximas Entregas</CardTitle><CardDescription>Fichas ordenadas por fecha de entrega</CardDescription></div>
                        <Button size="sm" onClick={onNewWorkOrderClick}><Plus className="h-4 w-4 mr-2" />Nueva Ficha</Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {state.workOrders.filter(wo => wo.status === 'open' || wo.status === 'in_progress').sort((a, b) => (a.estimatedDeliveryDate?.getTime() || Infinity) - (b.estimatedDeliveryDate?.getTime() || Infinity)).slice(0, 5).map(workOrder => (
                                <div key={workOrder.id} className="flex items-center justify-between p-3 border rounded">
                                    <div className="space-y-1"><p className="text-sm">{workOrder.client.name}</p><p className="text-xs text-muted-foreground">{workOrder.bicycle.brand} {workOrder.bicycle.model}</p></div>
                                    <div className="text-right"><Badge variant={workOrder.status === 'open' ? 'default' : 'secondary'}>{translateStatus(workOrder.status)}</Badge>{workOrder.estimatedDeliveryDate && (<p className="text-xs text-muted-foreground mt-1">Entrega: {workOrder.estimatedDeliveryDate.toLocaleDateString()}</p>)}</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Para Entrega</CardTitle><CardDescription>Bicicletas listas para entregar a clientes</CardDescription></CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {state.workOrders.filter(wo => wo.status === 'ready_for_delivery').map(workOrder => (<div key={workOrder.id} className="flex items-center justify-between p-3 border rounded"><div className="space-y-1"><p className="text-sm">{workOrder.client.name}</p><p className="text-xs text-muted-foreground">Total: ${workOrder.totalAmount.toLocaleString()}</p></div><Button size="sm" onClick={() => dispatch({ type: 'DELIVER_WORK_ORDER', payload: workOrder.id })}><CheckCircle2 className="h-4 w-4 mr-1" />Entregar</Button></div>))}
                            {state.workOrders.filter(wo => wo.status === 'ready_for_delivery').length === 0 && (<p className="text-sm text-muted-foreground text-center py-4">No hay bicicletas listas para entrega</p>)}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const ClientsTab = ({ onNewClientClick }: { onNewClientClick: () => void }) => {
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
            <Card><CardContent className="pt-6"><Table><TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Email</TableHead><TableHead>Teléfono</TableHead><TableHead>Bicicletas</TableHead><TableHead className="text-center">Acciones</TableHead></TableRow></TableHeader><TableBody>
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
            </TableBody></Table></CardContent></Card>

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

const BicyclesTab = ({ onNewBicycleClick }: { onNewBicycleClick: () => void }) => {
    const { state, dispatch } = useApp();
    const [editingBicycle, setEditingBicycle] = useState<Bicycle | null>(null);

    const handleUpdateBicycle = () => {
        if (editingBicycle) {
            dispatch({ type: 'UPDATE_BICYCLE', payload: editingBicycle });
            setEditingBicycle(null); // Cierra el modal
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
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button>
                                                </AlertDialogTrigger>
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
                                <div><Label>Marca</Label><Input value={editingBicycle.brand} onChange={(e) => setEditingBicycle({ ...editingBicycle, brand: e.target.value })}/></div>
                                <div><Label>Modelo</Label><Input value={editingBicycle.model} onChange={(e) => setEditingBicycle({ ...editingBicycle, model: e.target.value })}/></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label>Tipo</Label><Select value={editingBicycle.type} onValueChange={(value: any) => setEditingBicycle({ ...editingBicycle, type: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="mountain">Montaña</SelectItem><SelectItem value="road">Ruta</SelectItem><SelectItem value="hybrid">Híbrida</SelectItem><SelectItem value="electric">Eléctrica</SelectItem><SelectItem value="bmx">BMX</SelectItem><SelectItem value="other">Otro</SelectItem></SelectContent></Select></div>
                                <div><Label>Color</Label><Input value={editingBicycle.color} onChange={(e) => setEditingBicycle({ ...editingBicycle, color: e.target.value })}/></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label>N° Serie</Label><Input value={editingBicycle.serialNumber || ''} onChange={(e) => setEditingBicycle({ ...editingBicycle, serialNumber: e.target.value })}/></div>
                                <div><Label>Año</Label><Input type="number" value={editingBicycle.year} onChange={(e) => setEditingBicycle({ ...editingBicycle, year: parseInt(e.target.value) })}/></div>
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

const WorkOrdersTab = ({ onNewWorkOrderClick }: { onNewWorkOrderClick: () => void }) => {
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
                                  <TableCell>
                                    <Badge variant={ workOrder.status === 'open' ? 'default' : workOrder.status === 'in_progress' ? 'secondary' : workOrder.status === 'ready_for_delivery' ? 'outline' : 'default' }>
                                      {translateStatus(workOrder.status)}
                                    </Badge>
                                  </TableCell>
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
                            <div><Label>Fecha Entrega Estimada</Label><Input type="date" value={editingWorkOrder.estimatedDeliveryDate ? new Date(editingWorkOrder.estimatedDeliveryDate).toISOString().split('T')[0] : ''} onChange={(e) => setEditingWorkOrder({ ...editingWorkOrder, estimatedDeliveryDate: new Date(e.target.value) })} /></div>
                            <Button onClick={handleUpdateWorkOrder} className="w-full">Guardar Cambios</Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

const DataTab = () => (
    <div className="space-y-6">
        <Card><CardHeader><CardTitle>Análisis y Reportes</CardTitle><CardDescription>Filtra y exporta el historial de fichas de trabajo.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex items-center gap-4"><div className="grid gap-2"><Label htmlFor="start-date">Fecha de Inicio</Label><Input id="start-date" type="date" /></div><div className="grid gap-2"><Label htmlFor="end-date">Fecha de Fin</Label><Input id="end-date" type="date" /></div><Button className="self-end">Filtrar</Button><Button variant="outline" className="self-end ml-auto"><Download className="h-4 w-4 mr-2" />Descargar Excel</Button></div></CardContent></Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card><CardHeader><CardTitle>Gráfico 1 (Próximamente)</CardTitle></CardHeader><CardContent className="h-60 bg-slate-50 flex items-center justify-center rounded-lg"><p className="text-muted-foreground">Datos del Backend</p></CardContent></Card>
            <Card><CardHeader><CardTitle>Gráfico 2 (Próximamente)</CardTitle></CardHeader><CardContent className="h-60 bg-slate-50 flex items-center justify-center rounded-lg"><p className="text-muted-foreground">Datos del Backend</p></CardContent></Card>
        </div>
        <Card><CardHeader><CardTitle>Historial Detallado de Fichas</CardTitle></CardHeader><CardContent><p className="text-center text-muted-foreground py-8">La tabla con el detalle de servicios, piezas y totales aparecerá aquí una vez conectado el backend.</p></CardContent></Card>
    </div>
);

// --- COMPONENTE PRINCIPAL ---

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  
  const [newWorkOrder, setNewWorkOrder] = useState({ clientId: '', bicycleId: '', description: '', estimatedDeliveryDate: '' });
  const [showAddWorkOrderModal, setShowAddWorkOrderModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showAddBicycleModal, setShowAddBicycleModal] = useState(false);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1>Panel de Administración</h1>
        <p className="text-muted-foreground">Sistema de gestión del taller Marchant Bike</p>
      </div>

      <Tabs defaultValue="overview" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="clients">Clientes</TabsTrigger>
            <TabsTrigger value="bicycles">Bicicletas</TabsTrigger>
            <TabsTrigger value="workorders">Fichas</TabsTrigger>
            <TabsTrigger value="inventory">Inventario</TabsTrigger>
            <TabsTrigger value="data">Datos</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6"><OverviewTab onNewWorkOrderClick={() => setShowAddWorkOrderModal(true)} /></TabsContent>
        <TabsContent value="clients" className="mt-6"><ClientsTab onNewClientClick={() => setShowAddClientModal(true)} /></TabsContent>
        <TabsContent value="bicycles" className="mt-6"><BicyclesTab onNewBicycleClick={() => setShowAddBicycleModal(true)} /></TabsContent>
        <TabsContent value="workorders" className="mt-6"><WorkOrdersTab onNewWorkOrderClick={() => setShowAddWorkOrderModal(true)} /></TabsContent>
        <TabsContent value="inventory" className="mt-6"><InventoryManagement activeTab={activeTab} /></TabsContent>
        <TabsContent value="data" className="mt-6"><DataTab /></TabsContent>
      </Tabs>
      
      {/* --- GESTIÓN CENTRALIZADA DE TODOS LOS MODALES --- */}

      <Dialog open={showAddWorkOrderModal} onOpenChange={(isOpen) => {
          setShowAddWorkOrderModal(isOpen);
          if (!isOpen) { setNewWorkOrder({ clientId: '', bicycleId: '', description: '', estimatedDeliveryDate: '' }); }
      }}>
          <DialogContent>
              <NewWorkOrderForm 
                  closeModal={() => {
                      setShowAddWorkOrderModal(false);
                      setNewWorkOrder({ clientId: '', bicycleId: '', description: '', estimatedDeliveryDate: '' });
                  }}
                  newWorkOrder={newWorkOrder}
                  setNewWorkOrder={setNewWorkOrder}
                  onShowAddClient={() => setShowAddClientModal(true)}
                  onShowAddBicycle={() => setShowAddBicycleModal(true)}
              />
          </DialogContent>
      </Dialog>

      <Dialog open={showAddClientModal} onOpenChange={setShowAddClientModal}>
          <DialogContent>
              <NewClientForm 
                  closeModal={() => setShowAddClientModal(false)}
                  onClientCreated={(client) => setNewWorkOrder({...newWorkOrder, clientId: client.id})}
              />
          </DialogContent>
      </Dialog>
      <Dialog open={showAddBicycleModal} onOpenChange={setShowAddBicycleModal}>
          <DialogContent>
              <NewBicycleForm 
                  closeModal={() => setShowAddBicycleModal(false)}
                  selectedClientId={newWorkOrder.clientId}
                  onBicycleCreated={(bicycle) => setNewWorkOrder({...newWorkOrder, bicycleId: bicycle.id})}
              />
          </DialogContent>
      </Dialog>
    </div>
  );
}