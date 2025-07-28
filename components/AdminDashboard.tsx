import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Users, Bike, FileText, Plus, Edit, CheckCircle2, Truck, BarChart3, Download, Trash2 } from 'lucide-react';
import { Client, Bicycle, WorkOrder } from '../lib/types';
import InventoryManagement from './InventoryManagement';
import { db } from '../firebase/config';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  
  const [clients, setClients] = useState<Client[]>([]);
  const [bicycles, setBicycles] = useState<Bicycle[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);

  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const clientsSnapshot = await getDocs(collection(db, "clients"));
      const clientsData = clientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Client[];
      
      const bicyclesSnapshot = await getDocs(collection(db, "bicycles"));
      const bicyclesData = bicyclesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Bicycle[];

      const workOrdersSnapshot = await getDocs(collection(db, "workorders"));
      const workOrdersData = workOrdersSnapshot.docs.map(doc => {
        const data = doc.data();
        const client = clientsData.find(c => c.id === data.clientId);
        const bicycle = bicyclesData.find(b => b.id === data.bicycleId);
        const estimatedDeliveryDate = data.estimatedDeliveryDate?.toDate();
        return {
          id: doc.id,
          ...data,
          client,
          bicycle,
          estimatedDeliveryDate,
        } as WorkOrder;
      });

      setClients(clientsData);
      setBicycles(bicyclesData);
      setWorkOrders(workOrdersData);

    } catch (error) {
      console.error("Error fetching data: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalClients = clients.length;
  const totalBicycles = bicycles.length;
  const openWorkOrders = workOrders.filter(wo => wo.status === 'open' || wo.status === 'in_progress').length;
  const readyForDelivery = workOrders.filter(wo => wo.status === 'ready_for_delivery').length;

  const OverviewTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totalClients}</div>
            <p className="text-xs text-muted-foreground">Total registrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Bicicletas</CardTitle>
            <Bike className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totalBicycles}</div>
            <p className="text-xs text-muted-foreground">En el sistema</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Fichas Abiertas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{openWorkOrders}</div>
            <p className="text-xs text-muted-foreground">Pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Para Entrega</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{readyForDelivery}</div>
            <p className="text-xs text-muted-foreground">Listas</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Fichas Recientes</CardTitle>
            <CardDescription>Últimas fichas de trabajo creadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {workOrders
                .filter(wo => wo.status === 'open' || wo.status === 'in_progress')
                .sort((a, b) => {
                  if (!a.estimatedDeliveryDate) return 1;
                  if (!b.estimatedDeliveryDate) return -1;
                  return new Date(b.estimatedDeliveryDate).getTime() - new Date(a.estimatedDeliveryDate).getTime();
                })
                .slice(0, 5)
                .map(workOrder => (
                  <div key={workOrder.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="space-y-1">
                      <p className="text-sm">{workOrder.client?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {workOrder.bicycle?.brand} {workOrder.bicycle?.model}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={workOrder.status === 'open' ? 'default' : 'secondary'}>
                        {workOrder.status === 'open' ? 'Abierta' : 'En Progreso'}
                      </Badge>
                      {workOrder.estimatedDeliveryDate && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Entrega: {new Date(workOrder.estimatedDeliveryDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Para Entrega</CardTitle>
            <CardDescription>Bicicletas listas para entregar a clientes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {workOrders
                .filter(wo => wo.status === 'ready_for_delivery')
                .map(workOrder => (
                  <div key={workOrder.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="space-y-1">
                      <p className="text-sm">{workOrder.client?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Total: ${workOrder.totalAmount.toLocaleString()}
                      </p>
                    </div>
                    {/* Placeholder for action, as dispatch is removed for this logic */}
                    <Button size="sm">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Entregar
                    </Button>
                  </div>
                ))}
              {workOrders.filter(wo => wo.status === 'ready_for_delivery').length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay bicicletas listas para entrega
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const ClientsTab = ({ clients, loading, onDataChange }: { clients: Client[], loading: boolean, onDataChange: () => void }) => {
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', address: '' });

    const handleAddClient = async () => {
      if (!newClient.name || !newClient.phone) {
        alert("El nombre y el teléfono son obligatorios.");
        return;
      }
      try {
        await addDoc(collection(db, "clients"), {
          ...newClient,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        setNewClient({ name: '', email: '', phone: '', address: '' });
        setAddDialogOpen(false);
        onDataChange();
      } catch (error) {
        console.error("Error adding client: ", error);
        alert("Hubo un error al guardar el cliente.");
      }
    };

    const handleUpdateClient = async () => {
      if (!editingClient) return;
      try {
        const clientRef = doc(db, "clients", editingClient.id);
        const { id, ...clientData } = editingClient;
        await updateDoc(clientRef, {
          ...clientData,
          updatedAt: Timestamp.now()
        });
        setEditingClient(null);
        onDataChange();
      } catch (error) {
        console.error("Error updating client: ", error);
        alert("Hubo un error al actualizar el cliente.");
      }
    };

    const handleDeleteClient = async (clientId: string) => {
      if (window.confirm("¿Estás seguro de que quieres eliminar este cliente? Esta acción no se puede deshacer.")) {
        try {
          await deleteDoc(doc(db, "clients", clientId));
          onDataChange();
        } catch (error) {
          console.error("Error deleting client: ", error);
          alert("Hubo un error al eliminar el cliente.");
        }
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3>Gestión de Clientes</h3>
          <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
                <DialogDescription>Completa la información del cliente</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input id="name" value={newClient.name} onChange={(e) => setNewClient({...newClient, name: e.target.value})} placeholder="Juan Pérez"/>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={newClient.email} onChange={(e) => setNewClient({...newClient, email: e.target.value})} placeholder="juan@email.com"/>
                </div>
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input id="phone" value={newClient.phone} onChange={(e) => setNewClient({...newClient, phone: e.target.value})} placeholder="+56912345678"/>
                </div>
                <div>
                  <Label htmlFor="address">Dirección</Label>
                  <Textarea id="address" value={newClient.address} onChange={(e) => setNewClient({...newClient, address: e.target.value})} placeholder="Dirección completa"/>
                </div>
                <Button onClick={handleAddClient} className="w-full">Guardar Cliente</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <Card>
          <CardContent className="pt-6">
            {loading ? <p>Cargando clientes...</p> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map(client => (
                    <TableRow key={client.id}>
                      <TableCell>{client.name}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{client.phone}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-2">
                           <Button variant="outline" size="sm" onClick={() => setEditingClient(client)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteClient(client.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <Dialog open={!!editingClient} onOpenChange={(isOpen) => !isOpen && setEditingClient(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Cliente</DialogTitle>
              <DialogDescription>Actualiza la información del cliente.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-name">Nombre Completo</Label>
                <Input id="edit-name" value={editingClient?.name || ''} onChange={(e) => setEditingClient(prev => prev ? {...prev, name: e.target.value} : null)}/>
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" type="email" value={editingClient?.email || ''} onChange={(e) => setEditingClient(prev => prev ? {...prev, email: e.target.value} : null)} />
              </div>
              <div>
                <Label htmlFor="edit-phone">Teléfono</Label>
                <Input id="edit-phone" value={editingClient?.phone || ''} onChange={(e) => setEditingClient(prev => prev ? {...prev, phone: e.target.value} : null)} />
              </div>
              <div>
                <Label htmlFor="edit-address">Dirección</Label>
                <Textarea id="edit-address" value={editingClient?.address || ''} onChange={(e) => setEditingClient(prev => prev ? {...prev, address: e.target.value} : null)} />
              </div>
              <Button onClick={handleUpdateClient} className="w-full">Guardar Cambios</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  const BicyclesTab = ({ clients, bicycles, loading, onDataChange }: { clients: Client[], bicycles: Bicycle[], loading: boolean, onDataChange: () => void }) => {
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [editingBicycle, setEditingBicycle] = useState<Bicycle | null>(null);
    const [newBicycle, setNewBicycle] = useState({ clientId: '', brand: '', model: '', type: 'mountain' as Bicycle['type'], color: '', serialNumber: '', year: new Date().getFullYear(), notes: '' });

    const handleAddBicycle = async () => {
      if (!newBicycle.clientId || !newBicycle.brand || !newBicycle.model) {
        alert("Cliente, marca y modelo son obligatorios.");
        return;
      }
      try {
        await addDoc(collection(db, "bicycles"), {
          ...newBicycle,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        setNewBicycle({ clientId: '', brand: '', model: '', type: 'mountain', color: '', serialNumber: '', year: new Date().getFullYear(), notes: '' });
        setAddDialogOpen(false);
        onDataChange();
      } catch (error) {
        console.error("Error adding bicycle:", error);
        alert("Hubo un error al guardar la bicicleta.");
      }
    };
    
    const handleUpdateBicycle = async () => {
      if (!editingBicycle) return;
      try {
        const bicycleRef = doc(db, "bicycles", editingBicycle.id);
        const { id, ...bicycleData } = editingBicycle;
        await updateDoc(bicycleRef, {
          ...bicycleData,
          updatedAt: Timestamp.now()
        });
        setEditingBicycle(null);
        onDataChange();
      } catch (error) {
        console.error("Error updating bicycle:", error);
        alert("Hubo un error al actualizar la bicicleta.");
      }
    };
    
    const handleDeleteBicycle = async (bicycleId: string) => {
      if (window.confirm("¿Estás seguro de que quieres eliminar esta bicicleta?")) {
        try {
          await deleteDoc(doc(db, "bicycles", bicycleId));
          onDataChange();
        } catch (error) {
          console.error("Error deleting bicycle:", error);
          alert("Hubo un error al eliminar la bicicleta.");
        }
      }
    };

    const getClientName = (clientId: string) => {
      return clients.find(c => c.id === clientId)?.name || 'N/A';
    };

    const bicycleForm = (bicycle: any, setBicycle: (data: any) => void) => (
      <div className="space-y-4">
        <div>
          <Label htmlFor="clientId">Cliente</Label>
          <Select value={bicycle.clientId} onValueChange={(value) => setBicycle({...bicycle, clientId: value})}>
            <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
            <SelectContent>
              {clients.map(client => (
                <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="brand">Marca</Label>
            <Input id="brand" value={bicycle.brand} onChange={(e) => setBicycle({...bicycle, brand: e.target.value})} placeholder="Trek, Giant, etc."/>
          </div>
          <div>
            <Label htmlFor="model">Modelo</Label>
            <Input id="model" value={bicycle.model} onChange={(e) => setBicycle({...bicycle, model: e.target.value})} placeholder="Marlin 7, Escape 3, etc."/>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="type">Tipo</Label>
            <Select value={bicycle.type} onValueChange={(value: Bicycle['type']) => setBicycle({...bicycle, type: value})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mountain">Montaña</SelectItem>
                <SelectItem value="road">Ruta</SelectItem>
                <SelectItem value="hybrid">Híbrida</SelectItem>
                <SelectItem value="electric">Eléctrica</SelectItem>
                <SelectItem value="bmx">BMX</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="color">Color</Label>
            <Input id="color" value={bicycle.color} onChange={(e) => setBicycle({...bicycle, color: e.target.value})} placeholder="Azul, Rojo, etc."/>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="serialNumber">Número de Serie</Label>
            <Input id="serialNumber" value={bicycle.serialNumber} onChange={(e) => setBicycle({...bicycle, serialNumber: e.target.value})} placeholder="Opcional"/>
          </div>
          <div>
            <Label htmlFor="year">Año</Label>
            <Input id="year" type="number" value={bicycle.year} onChange={(e) => setBicycle({...bicycle, year: parseInt(e.target.value, 10)})}/>
          </div>
        </div>
        <div>
          <Label htmlFor="notes">Notas</Label>
          <Textarea id="notes" value={bicycle.notes} onChange={(e) => setBicycle({...bicycle, notes: e.target.value})} placeholder="Observaciones adicionales"/>
        </div>
      </div>
    );

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3>Gestión de Bicicletas</h3>
          <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Nueva Bicicleta</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Nueva Bicicleta</DialogTitle>
                <DialogDescription>Registra una nueva bicicleta en el sistema</DialogDescription>
              </DialogHeader>
              {bicycleForm(newBicycle, setNewBicycle)}
              <Button onClick={handleAddBicycle} className="w-full mt-4">Guardar Bicicleta</Button>
            </DialogContent>
          </Dialog>
        </div>
        <Card>
          <CardContent className="pt-6">
            {loading ? <p>Cargando bicicletas...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Marca/Modelo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Año</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bicycles.map(bicycle => (
                  <TableRow key={bicycle.id}>
                    <TableCell>{getClientName(bicycle.clientId)}</TableCell>
                    <TableCell>{bicycle.brand} {bicycle.model}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{bicycle.type.charAt(0).toUpperCase() + bicycle.type.slice(1)}</Badge>
                    </TableCell>
                    <TableCell>{bicycle.year}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingBicycle(bicycle)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteBicycle(bicycle.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>
        <Dialog open={!!editingBicycle} onOpenChange={(isOpen) => !isOpen && setEditingBicycle(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Bicicleta</DialogTitle>
              <DialogDescription>Actualiza la información de la bicicleta.</DialogDescription>
            </DialogHeader>
            {editingBicycle && bicycleForm(editingBicycle, setEditingBicycle)}
            <Button onClick={handleUpdateBicycle} className="w-full mt-4">Guardar Cambios</Button>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  const WorkOrdersTab = ({ clients, bicycles, workOrders, loading, onDataChange }: { clients: Client[], bicycles: Bicycle[], workOrders: WorkOrder[], loading: boolean, onDataChange: () => void }) => {
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrder | null>(null);
    const [newWorkOrder, setNewWorkOrder] = useState({ clientId: '', bicycleId: '', description: '', estimatedDeliveryDate: '' });
    const [availableBicycles, setAvailableBicycles] = useState<Bicycle[]>([]);

    useEffect(() => {
        if (newWorkOrder.clientId) {
            setAvailableBicycles(bicycles.filter(b => b.clientId === newWorkOrder.clientId));
        } else {
            setAvailableBicycles([]);
        }
    }, [newWorkOrder.clientId, bicycles]);

    useEffect(() => {
        if (editingWorkOrder?.clientId) {
            setAvailableBicycles(bicycles.filter(b => b.clientId === editingWorkOrder.clientId));
        }
    }, [editingWorkOrder, bicycles]);

    const handleAddWorkOrder = async () => {
        if (!newWorkOrder.clientId || !newWorkOrder.bicycleId) {
            alert("Cliente y bicicleta son obligatorios.");
            return;
        }
        try {
            const dataToSave = {
                clientId: newWorkOrder.clientId,
                bicycleId: newWorkOrder.bicycleId,
                description: newWorkOrder.description,
                status: 'open',
                services: [],
                parts: [],
                totalAmount: 0,
                estimatedDeliveryDate: newWorkOrder.estimatedDeliveryDate ? Timestamp.fromDate(new Date(newWorkOrder.estimatedDeliveryDate)) : null,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            };
            await addDoc(collection(db, "workorders"), dataToSave);
            setNewWorkOrder({ clientId: '', bicycleId: '', description: '', estimatedDeliveryDate: '' });
            setAddDialogOpen(false);
            onDataChange();
        } catch (error) {
            console.error("Error adding work order:", error);
            alert("Hubo un error al guardar la ficha de trabajo.");
        }
    };

    const handleUpdateWorkOrder = async () => {
        if (!editingWorkOrder) return;
        try {
            const workOrderRef = doc(db, "workorders", editingWorkOrder.id);
            const { id, client, bicycle, ...workOrderData } = editingWorkOrder;

            const dataToSave = {
                ...workOrderData,
                estimatedDeliveryDate: editingWorkOrder.estimatedDeliveryDate ? Timestamp.fromDate(new Date(editingWorkOrder.estimatedDeliveryDate)) : null,
                updatedAt: Timestamp.now()
            };

            await updateDoc(workOrderRef, dataToSave);
            setEditingWorkOrder(null);
            onDataChange();
        } catch (error) {
            console.error("Error updating work order:", error);
            alert("Hubo un error al actualizar la ficha.");
        }
    };
    
    const handleDeleteWorkOrder = async (workOrderId: string) => {
        if (window.confirm("¿Estás seguro de que quieres eliminar esta ficha de trabajo?")) {
            try {
                await deleteDoc(doc(db, "workorders", workOrderId));
                onDataChange();
            } catch (error) {
                console.error("Error deleting work order:", error);
                alert("Hubo un error al eliminar la ficha.");
            }
        }
    };

    const formatDate = (date: any) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString();
    };

    const workOrderForm = (workOrder: any, setWorkOrder: (data: any) => void) => (
        <div className="space-y-4">
            <div>
              <Label htmlFor="clientId-wo">Cliente</Label>
              <Select value={workOrder.clientId} onValueChange={(value) => setWorkOrder({...workOrder, clientId: value, bicycleId: ''})}>
                <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="bicycleId-wo">Bicicleta</Label>
              <Select 
                value={workOrder.bicycleId} 
                onValueChange={(value) => setWorkOrder({...workOrder, bicycleId: value})}
                disabled={!workOrder.clientId}
              >
                <SelectTrigger><SelectValue placeholder="Seleccionar bicicleta" /></SelectTrigger>
                <SelectContent>
                  {availableBicycles.map(bicycle => (
                    <SelectItem key={bicycle.id} value={bicycle.id}>{bicycle.brand} {bicycle.model} ({bicycle.color})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description-wo">Descripción del Problema</Label>
              <Textarea
                id="description-wo"
                value={workOrder.description}
                onChange={(e) => setWorkOrder({...workOrder, description: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="estimatedDeliveryDate">Fecha de Entrega Estimada</Label>
              <Input 
                id="estimatedDeliveryDate" 
                type="date" 
                value={workOrder.estimatedDeliveryDate ? new Date(workOrder.estimatedDeliveryDate).toISOString().split('T')[0] : ''} 
                onChange={(e) => setWorkOrder({...workOrder, estimatedDeliveryDate: e.target.value})} />
            </div>
        </div>
    );
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3>Gestión de Fichas de Trabajo</h3>
          <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Nueva Ficha</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nueva Ficha de Trabajo</DialogTitle>
                <DialogDescription>Registra una nueva ficha de trabajo</DialogDescription>
              </DialogHeader>
              {workOrderForm(newWorkOrder, setNewWorkOrder)}
              <Button onClick={handleAddWorkOrder} className="w-full mt-4">Crear Ficha</Button>
            </DialogContent>
          </Dialog>
        </div>
        <Card>
          <CardContent className="pt-6">
          {loading ? <p>Cargando fichas de trabajo...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Bicicleta</TableHead>
                  <TableHead>Entrega Est.</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workOrders.map(workOrder => (
                  <TableRow key={workOrder.id}>
                    <TableCell>{workOrder.client?.name || 'N/A'}</TableCell>
                    <TableCell>{workOrder.bicycle ? `${workOrder.bicycle.brand} ${workOrder.bicycle.model}`: 'N/A'}</TableCell>
                    <TableCell>{formatDate(workOrder.estimatedDeliveryDate)}</TableCell>
                    <TableCell>
                      <Badge variant={
                        workOrder.status === 'open' ? 'default' :
                        workOrder.status === 'in_progress' ? 'secondary' :
                        'outline'
                      }>
                        {workOrder.status === 'open' ? 'Abierta' :
                         workOrder.status === 'in_progress' ? 'En Progreso' :
                         'Lista'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                       <div className="flex items-center justify-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingWorkOrder(workOrder)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteWorkOrder(workOrder.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                       </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          </CardContent>
        </Card>
        <Dialog open={!!editingWorkOrder} onOpenChange={(isOpen) => !isOpen && setEditingWorkOrder(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Ficha de Trabajo</DialogTitle>
                    <DialogDescription>Actualiza la información de la ficha.</DialogDescription>
                </DialogHeader>
                {editingWorkOrder && workOrderForm(editingWorkOrder, setEditingWorkOrder)}
                <Button onClick={handleUpdateWorkOrder} className="w-full mt-4">Guardar Cambios</Button>
            </DialogContent>
        </Dialog>
      </div>
    );
  };

  const DataTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Análisis y Reportes</CardTitle>
          <CardDescription>Filtra y exporta el historial de fichas de trabajo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start-date">Fecha de Inicio</Label>
              <Input id="start-date" type="date" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end-date">Fecha de Fin</Label>
              <Input id="end-date" type="date" />
            </div>
            <Button className="self-end">Filtrar</Button>
            <Button variant="outline" className="self-end ml-auto">
              <Download className="h-4 w-4 mr-2" />
              Descargar Excel
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
              <CardHeader><CardTitle>Gráfico 1 (Próximamente)</CardTitle></CardHeader>
              <CardContent className="h-60 bg-slate-50 flex items-center justify-center rounded-lg">
                  <p className="text-muted-foreground">Datos del Backend</p>
              </CardContent>
          </Card>
          <Card>
              <CardHeader><CardTitle>Gráfico 2 (Próximamente)</CardTitle></CardHeader>
              <CardContent className="h-60 bg-slate-50 flex items-center justify-center rounded-lg">
                  <p className="text-muted-foreground">Datos del Backend</p>
              </CardContent>
          </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Historial Detallado de Fichas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">La tabla con el detalle de servicios, piezas y totales aparecerá aquí una vez conectado el backend.</p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1>Panel de Administración</h1>
        <p className="text-muted-foreground">Sistema de gestión del taller Merchant Bike</p>
      </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="bicycles">Bicicletas</TabsTrigger>
          <TabsTrigger value="workorders">Fichas</TabsTrigger>
          <TabsTrigger value="inventory">Inventario</TabsTrigger>
          <TabsTrigger value="data">Datos</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6"><OverviewTab /></TabsContent>
        <TabsContent value="clients" className="mt-6"><ClientsTab clients={clients} loading={loading} onDataChange={fetchData} /></TabsContent>
        <TabsContent value="bicycles" className="mt-6"><BicyclesTab clients={clients} bicycles={bicycles} loading={loading} onDataChange={fetchData} /></TabsContent>
        <TabsContent value="workorders" className="mt-6"><WorkOrdersTab clients={clients} bicycles={bicycles} workOrders={workOrders} loading={loading} onDataChange={fetchData} /></TabsContent>
        <TabsContent value="inventory" className="mt-6"><InventoryManagement /></TabsContent>
        <TabsContent value="data" className="mt-6"><DataTab /></TabsContent>
      </Tabs>
    </div>
  );
}