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
import ClientSearchCombobox from './ClientSearchCombobox';

type ModalType = 'addWorkOrder' | 'addClientFromWorkOrder' | 'addBicycleFromWorkOrder';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  
  const [clients, setClients] = useState<Client[]>([]);
  const [bicycles, setBicycles] = useState<Bicycle[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeModal, setActiveModal] = useState<ModalType | null>(null);
  const [workOrderFormState, setWorkOrderFormState] = useState({ clientId: '', bicycleId: '', description: '', estimatedDeliveryDate: '' });

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
          id: doc.id, ...data, client, bicycle, estimatedDeliveryDate
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
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm">Clientes</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl">{totalClients}</div><p className="text-xs text-muted-foreground">Total registrados</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm">Bicicletas</CardTitle><Bike className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl">{totalBicycles}</div><p className="text-xs text-muted-foreground">En el sistema</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm">Fichas Abiertas</CardTitle><FileText className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl">{openWorkOrders}</div><p className="text-xs text-muted-foreground">Pendientes</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm">Para Entrega</CardTitle><Truck className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl">{readyForDelivery}</div><p className="text-xs text-muted-foreground">Listas</p></CardContent></Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle>Fichas Recientes</CardTitle><CardDescription>Últimas fichas de trabajo creadas</CardDescription></div>
            <Button size="sm" onClick={() => setActiveModal('addWorkOrder')}><Plus className="h-4 w-4 mr-2" />Nueva Ficha</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {workOrders
                .filter(wo => wo.status === 'open' || wo.status === 'in_progress')
                .sort((a, b) => (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())).slice(0, 5)
                .map(workOrder => (
                  <div key={workOrder.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="space-y-1"><p className="text-sm">{workOrder.client?.name}</p><p className="text-xs text-muted-foreground">{workOrder.bicycle?.brand} {workOrder.bicycle?.model}</p></div>
                    <div className="text-right"><Badge variant={workOrder.status === 'open' ? 'default' : 'secondary'}>{workOrder.status === 'open' ? 'Abierta' : 'En Progreso'}</Badge>
                      {workOrder.estimatedDeliveryDate && (<p className="text-xs text-muted-foreground mt-1">Entrega: {new Date(workOrder.estimatedDeliveryDate).toLocaleDateString()}</p>)}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Para Entrega</CardTitle><CardDescription>Bicicletas listas para entregar a clientes</CardDescription></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {workOrders.filter(wo => wo.status === 'ready_for_delivery').map(workOrder => (
                <div key={workOrder.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="space-y-1"><p className="text-sm">{workOrder.client?.name}</p><p className="text-xs text-muted-foreground">Total: ${workOrder.totalAmount.toLocaleString()}</p></div>
                  <Button size="sm"><CheckCircle2 className="h-4 w-4 mr-1" />Entregar</Button>
                </div>
              ))}
              {workOrders.filter(wo => wo.status === 'ready_for_delivery').length === 0 && (<p className="text-sm text-muted-foreground text-center py-4">No hay bicicletas listas para entrega</p>)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6"><h1>Panel de Administración</h1><p className="text-muted-foreground">Sistema de gestión del taller</p></div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6"><TabsTrigger value="overview">Resumen</TabsTrigger><TabsTrigger value="clients">Clientes</TabsTrigger><TabsTrigger value="bicycles">Bicicletas</TabsTrigger><TabsTrigger value="workorders">Fichas</TabsTrigger><TabsTrigger value="inventory">Inventario</TabsTrigger><TabsTrigger value="data">Datos</TabsTrigger></TabsList>
        <TabsContent value="overview" className="mt-6"><OverviewTab /></TabsContent>
        <TabsContent value="clients" className="mt-6"><ClientsTab clients={clients} loading={loading} onDataChange={fetchData} /></TabsContent>
        <TabsContent value="bicycles" className="mt-6"><BicyclesTab clients={clients} bicycles={bicycles} loading={loading} onDataChange={fetchData} /></TabsContent>
        <TabsContent value="workorders" className="mt-6"><WorkOrdersTab clients={clients} bicycles={bicycles} workOrders={workOrders} loading={loading} onDataChange={fetchData} setActiveModal={setActiveModal} /></TabsContent>
        <TabsContent value="inventory" className="mt-6"><InventoryManagement /></TabsContent>
        <TabsContent value="data" className="mt-6"><DataTab /></TabsContent>
      </Tabs>

      <Dialog open={activeModal === 'addWorkOrder'} onOpenChange={(isOpen) => !isOpen && setActiveModal(null)}>
        <DialogContent className="max-w-2xl">
          <WorkOrderForm clients={clients} bicycles={bicycles} onDataChange={fetchData} setActiveModal={setActiveModal} formState={workOrderFormState} setFormState={setWorkOrderFormState} closeModal={() => setActiveModal(null)}/>
        </DialogContent>
      </Dialog>
      <Dialog open={activeModal === 'addClientFromWorkOrder'} onOpenChange={(isOpen) => !isOpen && setActiveModal('addWorkOrder')}>
        <DialogContent>
          <ClientsTab isModal={true} closeModal={() => setActiveModal('addWorkOrder')} onClientCreated={(client) => { setWorkOrderFormState(prev => ({...prev, clientId: client.id})); setActiveModal('addWorkOrder'); }} clients={clients} loading={loading} onDataChange={fetchData} />
        </DialogContent>
      </Dialog>
      <Dialog open={activeModal === 'addBicycleFromWorkOrder'} onOpenChange={(isOpen) => !isOpen && setActiveModal('addWorkOrder')}>
        <DialogContent>
          <BicyclesTab isModal={true} closeModal={() => setActiveModal('addWorkOrder')} selectedClientId={workOrderFormState.clientId} onBicycleCreated={(bicycle) => { setWorkOrderFormState(prev => ({...prev, bicycleId: bicycle.id})); setActiveModal('addWorkOrder'); }} clients={clients} bicycles={bicycles} loading={loading} onDataChange={fetchData} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

const ClientsTab = ({ clients, loading, onDataChange, isModal = false, closeModal, onClientCreated }: { clients: Client[], loading: boolean, onDataChange: () => void, isModal?: boolean, closeModal?: () => void, onClientCreated?: (newClient: Client) => void }) => {
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', address: '' });

  const handleAddClient = async () => {
    if (!newClient.name || !newClient.phone) { alert("El nombre y el teléfono son obligatorios."); return; }
    try {
      const docRef = await addDoc(collection(db, "clients"), { ...newClient, createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
      const createdClient = { id: docRef.id, ...newClient };
      setNewClient({ name: '', email: '', phone: '', address: '' });
      await onDataChange();
      if (onClientCreated) { onClientCreated(createdClient as Client); }
      if (closeModal) closeModal(); 
      else setAddDialogOpen(false);
    } catch (error) { console.error("Error adding client: ", error); }
  };

  const handleUpdateClient = async () => {
    if (!editingClient) return;
    try {
      const { id, ...clientData } = editingClient;
      await updateDoc(doc(db, "clients", id), { ...clientData, updatedAt: Timestamp.now() });
      setEditingClient(null);
      onDataChange();
    } catch (error) { console.error("Error updating client: ", error); }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este cliente?")) {
      try {
        await deleteDoc(doc(db, "clients", clientId));
        onDataChange();
      } catch (error) { console.error("Error deleting client: ", error); }
    }
  };
  
  const ClientForm = ({ clientData, setClientData, onSave }: { clientData: any, setClientData: any, onSave: any }) => (
    <div className="space-y-4 py-4">
      <div><Label htmlFor="name">Nombre Completo</Label><Input id="name" value={clientData.name} onChange={(e) => setClientData({...clientData, name: e.target.value})} /></div>
      <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={clientData.email} onChange={(e) => setClientData({...clientData, email: e.target.value})} /></div>
      <div><Label htmlFor="phone">Teléfono</Label><Input id="phone" value={clientData.phone} onChange={(e) => setClientData({...clientData, phone: e.target.value})} /></div>
      <div><Label htmlFor="address">Dirección</Label><Textarea id="address" value={clientData.address} onChange={(e) => setClientData({...clientData, address: e.target.value})} /></div>
      <Button onClick={onSave} className="w-full">Guardar</Button>
    </div>
  );

  return (
    <div className="space-y-4">
      {!isModal && (<><div className="flex justify-between items-center"><h3>Gestión de Clientes</h3><Button onClick={() => setAddDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Nuevo Cliente</Button></div>
      <Card><CardContent className="pt-6">{loading ? <p>Cargando...</p> : (<Table><TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Email</TableHead><TableHead>Teléfono</TableHead><TableHead className="text-center">Acciones</TableHead></TableRow></TableHeader><TableBody>{clients.map(client => (<TableRow key={client.id}><TableCell>{client.name}</TableCell><TableCell>{client.email}</TableCell><TableCell>{client.phone}</TableCell><TableCell className="text-center"><div className="flex items-center justify-center space-x-2"><Button variant="outline" size="sm" onClick={() => setEditingClient(client)}><Edit className="h-4 w-4" /></Button><Button variant="destructive" size="sm" onClick={() => handleDeleteClient(client.id)}><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>))}</TableBody></Table>)}</CardContent></Card></>)}
      
      {isModal ? (
          <><DialogHeader><DialogTitle>Agregar Nuevo Cliente</DialogTitle></DialogHeader><ClientForm clientData={newClient} setClientData={setNewClient} onSave={handleAddClient} /></>
      ) : (
          <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}><DialogContent><DialogHeader><DialogTitle>Agregar Nuevo Cliente</DialogTitle></DialogHeader><ClientForm clientData={newClient} setClientData={setNewClient} onSave={handleAddClient} /></DialogContent></Dialog>
      )}

      <Dialog open={!!editingClient} onOpenChange={(isOpen) => !isOpen && setEditingClient(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Cliente</DialogTitle></DialogHeader>
          <ClientForm clientData={editingClient} setClientData={setEditingClient} onSave={handleUpdateClient} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

const BicyclesTab = ({ clients, bicycles, loading, onDataChange, isModal = false, closeModal, selectedClientId, onBicycleCreated }: { clients: Client[], bicycles: Bicycle[], loading: boolean, onDataChange: () => void, isModal?: boolean, closeModal?: () => void, selectedClientId?: string, onBicycleCreated?: (newBicycle: Bicycle) => void }) => {
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [editingBicycle, setEditingBicycle] = useState<Bicycle | null>(null);
  const [newBicycle, setNewBicycle] = useState({ clientId: selectedClientId || '', brand: '', model: '', type: 'mountain' as Bicycle['type'], color: '', serialNumber: '', year: new Date().getFullYear(), notes: '' });

  useEffect(() => { if(isModal && selectedClientId) { setNewBicycle(prev => ({...prev, clientId: selectedClientId})); } }, [isModal, selectedClientId]);

  const handleAddBicycle = async () => {
    if (!newBicycle.clientId || !newBicycle.brand) { alert("Cliente y marca son obligatorios."); return; }
    try {
      const docRef = await addDoc(collection(db, "bicycles"), { ...newBicycle, createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
      const createdBicycle = { id: docRef.id, ...newBicycle };
      setNewBicycle({ clientId: selectedClientId || '', brand: '', model: '', type: 'mountain', color: '', serialNumber: '', year: new Date().getFullYear(), notes: '' });
      await onDataChange();
      if (onBicycleCreated) onBicycleCreated(createdBicycle as Bicycle);
      if (closeModal) closeModal();
      else setAddDialogOpen(false);
    } catch (error) { console.error("Error adding bicycle:", error); }
  };
  
  const handleUpdateBicycle = async () => {
    if (!editingBicycle) return;
    try {
      const { id, ...bicycleData } = editingBicycle;
      await updateDoc(doc(db, "bicycles", id), { ...bicycleData, updatedAt: Timestamp.now() });
      setEditingBicycle(null);
      onDataChange();
    } catch (error) { console.error("Error updating bicycle:", error); }
  };
  
  const handleDeleteBicycle = async (bicycleId: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta bicicleta?")) {
      try {
        await deleteDoc(doc(db, "bicycles", bicycleId));
        onDataChange();
      } catch (error) { console.error("Error deleting bicycle:", error); }
    }
  };

  const getClientName = (clientId: string) => clients.find(c => c.id === clientId)?.name || 'N/A';
  const bicycleForm = (bicycle: any, setBicycle: (data: any) => void) => (
    <div className="space-y-4 pt-4">
      <div><Label>Cliente</Label><Select value={bicycle.clientId} onValueChange={(value) => setBicycle({...bicycle, clientId: value})}><SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger><SelectContent>{clients.map(client => (<SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>))}</SelectContent></Select></div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Marca</Label><Input value={bicycle.brand} onChange={(e) => setBicycle({...bicycle, brand: e.target.value})}/></div>
        <div><Label>Modelo</Label><Input value={bicycle.model} onChange={(e) => setBicycle({...bicycle, model: e.target.value})}/></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Tipo</Label><Select value={bicycle.type} onValueChange={(value: Bicycle['type']) => setBicycle({...bicycle, type: value})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="mountain">Montaña</SelectItem><SelectItem value="road">Ruta</SelectItem><SelectItem value="hybrid">Híbrida</SelectItem><SelectItem value="electric">Eléctrica</SelectItem><SelectItem value="bmx">BMX</SelectItem><SelectItem value="other">Otro</SelectItem></SelectContent></Select></div>
        <div><Label>Color</Label><Input value={bicycle.color} onChange={(e) => setBicycle({...bicycle, color: e.target.value})}/></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>N° Serie</Label><Input value={bicycle.serialNumber} onChange={(e) => setBicycle({...bicycle, serialNumber: e.target.value})}/></div>
        <div><Label>Año</Label><Input type="number" value={bicycle.year} onChange={(e) => setBicycle({...bicycle, year: parseInt(e.target.value, 10)})}/></div>
      </div>
      <div><Label>Notas</Label><Textarea value={bicycle.notes} onChange={(e) => setBicycle({...bicycle, notes: e.target.value})} /></div>
    </div>
  );

  return (
    <div className="space-y-4">
      {!isModal && (<><div className="flex justify-between items-center"><h3>Gestión de Bicicletas</h3><Button onClick={() => setAddDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Nueva Bicicleta</Button></div>
      <Card><CardContent className="pt-6">{loading ? <p>Cargando...</p> : (<Table><TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead>Marca/Modelo</TableHead><TableHead>Tipo</TableHead><TableHead>Año</TableHead><TableHead className="text-center">Acciones</TableHead></TableRow></TableHeader><TableBody>{bicycles.map(bicycle => (<TableRow key={bicycle.id}><TableCell>{getClientName(bicycle.clientId)}</TableCell><TableCell>{bicycle.brand} {bicycle.model}</TableCell><TableCell><Badge variant="outline">{bicycle.type}</Badge></TableCell><TableCell>{bicycle.year}</TableCell><TableCell className="text-center"><div className="flex items-center justify-center space-x-2"><Button variant="outline" size="sm" onClick={() => setEditingBicycle(bicycle)}><Edit className="h-4 w-4" /></Button><Button variant="destructive" size="sm" onClick={() => handleDeleteBicycle(bicycle.id)}><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>))}</TableBody></Table>)}</CardContent></Card></>)}
      {isModal ? (
           <><DialogHeader><DialogTitle>Agregar Bicicleta</DialogTitle></DialogHeader>{bicycleForm(newBicycle, setNewBicycle)}<Button onClick={handleAddBicycle} className="w-full mt-4">Guardar</Button></>
      ) : (
          <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}><DialogContent><DialogHeader><DialogTitle>Agregar Bicicleta</DialogTitle></DialogHeader>{bicycleForm(newBicycle, setNewBicycle)}<Button onClick={handleAddBicycle} className="w-full mt-4">Guardar</Button></DialogContent></Dialog>
      )}
      <Dialog open={!!editingBicycle} onOpenChange={(isOpen) => !isOpen && setEditingBicycle(null)}><DialogContent><DialogHeader><DialogTitle>Editar Bicicleta</DialogTitle></DialogHeader>{editingBicycle && bicycleForm(editingBicycle, setEditingBicycle)}<Button onClick={handleUpdateBicycle} className="w-full mt-4">Guardar Cambios</Button></DialogContent></Dialog>
    </div>
  );
};

const WorkOrdersTab = ({ clients, bicycles, workOrders, loading, onDataChange, setActiveModal }: { clients: Client[], bicycles: Bicycle[], workOrders: WorkOrder[], loading: boolean, onDataChange: () => void, setActiveModal: (modal: ModalType | null) => void; }) => {
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [newWorkOrder, setNewWorkOrder] = useState({ clientId: '', bicycleId: '', description: '', estimatedDeliveryDate: '' });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h3>Gestión de Fichas de Trabajo</h3><Button onClick={() => setAddDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Nueva Ficha</Button></div>
      <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <WorkOrderForm clients={clients} bicycles={bicycles} onDataChange={onDataChange} closeModal={() => setAddDialogOpen(false)} setActiveModal={setActiveModal} formState={newWorkOrder} setFormState={setNewWorkOrder}/>
        </DialogContent>
      </Dialog>
      <Card><CardContent className="pt-6">{loading ? <p>Cargando fichas...</p> : (<Table><TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead>Bicicleta</TableHead><TableHead>Entrega Est.</TableHead><TableHead>Estado</TableHead><TableHead className="text-center">Acciones</TableHead></TableRow></TableHeader><TableBody>{workOrders.map(workOrder => (<TableRow key={workOrder.id}><TableCell>{workOrder.client?.name || 'N/A'}</TableCell><TableCell>{workOrder.bicycle ? `${workOrder.bicycle.brand} ${workOrder.bicycle.model}`: 'N/A'}</TableCell><TableCell>{workOrder.estimatedDeliveryDate ? new Date(workOrder.estimatedDeliveryDate).toLocaleDateString() : 'N/A'}</TableCell><TableCell><Badge variant={workOrder.status === 'open' ? 'default' : 'secondary'}>{workOrder.status}</Badge></TableCell><TableCell className="text-center"><Button variant="outline" size="sm"><Edit className="h-4 w-4" /></Button></TableCell></TableRow>))}</TableBody></Table>)}</CardContent></Card>
    </div>
  );
};

const WorkOrderForm = ({ clients, bicycles, onDataChange, closeModal, setActiveModal, formState, setFormState }: { clients: Client[], bicycles: Bicycle[], onDataChange: () => void, closeModal: () => void, setActiveModal: (modal: ModalType | null) => void, formState: any, setFormState: any }) => {
  const [availableBicycles, setAvailableBicycles] = useState<Bicycle[]>([]);

  useEffect(() => {
    if (formState.clientId) { setAvailableBicycles(bicycles.filter(b => b.clientId === formState.clientId)); } 
    else { setAvailableBicycles([]); }
  }, [formState.clientId, bicycles]);

  const handleAddWorkOrder = async () => {
    if (!formState.clientId || !formState.bicycleId) { alert("Cliente y bicicleta son obligatorios."); return; }
    try {
      await addDoc(collection(db, "workorders"), {
        clientId: formState.clientId, bicycleId: formState.bicycleId, description: formState.description, status: 'open', services: [], parts: [], totalAmount: 0,
        estimatedDeliveryDate: formState.estimatedDeliveryDate ? Timestamp.fromDate(new Date(formState.estimatedDeliveryDate)) : null,
        createdAt: Timestamp.now(), updatedAt: Timestamp.now()
      });
      setFormState({ clientId: '', bicycleId: '', description: '', estimatedDeliveryDate: '' });
      closeModal();
      onDataChange();
    } catch (error) { console.error("Error adding work order:", error); }
  };

  return (
    <>
      <DialogHeader><DialogTitle>Crear Nueva Ficha de Trabajo</DialogTitle></DialogHeader>
      <div className="space-y-4 pt-4">
        
        {/* --- CAMBIO AQUÍ --- */}
        <div className="flex items-end gap-2">
          <div className="flex-grow">
            <Label>Cliente</Label>
            <ClientSearchCombobox 
              clients={clients} 
              selectedClientId={formState.clientId} 
              onSelectClient={(clientId) => setFormState({ ...formState, clientId, bicycleId: '' })} 
              onAddNewClient={() => setActiveModal('addClientFromWorkOrder')}
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => setActiveModal('addClientFromWorkOrder')}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {/* --- FIN DEL CAMBIO --- */}

        <div className="flex items-end gap-2">
          <div className="flex-grow">
            <Label htmlFor="bicycleId">Bicicleta</Label>
            <Select value={formState.bicycleId} onValueChange={(value) => setFormState({ ...formState, bicycleId: value })} disabled={!formState.clientId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar bicicleta" />
              </SelectTrigger>
              <SelectContent>
                {availableBicycles.map(bicycle => (
                  <SelectItem key={bicycle.id} value={bicycle.id}>{bicycle.brand} {bicycle.model}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="icon" onClick={() => setActiveModal('addBicycleFromWorkOrder')} disabled={!formState.clientId}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <div><Label>Descripción</Label><Textarea value={formState.description} onChange={(e) => setFormState({...formState, description: e.target.value})} /></div>
        <div><Label>Fecha Entrega Estimada</Label><Input type="date" value={formState.estimatedDeliveryDate} onChange={(e) => setFormState({...formState, estimatedDeliveryDate: e.target.value})} /></div>
        <Button onClick={handleAddWorkOrder} className="w-full">Crear Ficha</Button>
      </div>
    </>
  );
};

const DataTab = () => (
    <div className="space-y-6">
      <Card><CardHeader><CardTitle>Análisis y Reportes</CardTitle><CardDescription>Filtra y exporta el historial de fichas de trabajo.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex items-center gap-4"><div className="grid gap-2"><Label htmlFor="start-date">Fecha de Inicio</Label><Input id="start-date" type="date" /></div><div className="grid gap-2"><Label htmlFor="end-date">Fecha de Fin</Label><Input id="end-date" type="date" /></div><Button className="self-end">Filtrar</Button><Button variant="outline" className="self-end ml-auto"><Download className="h-4 w-4 mr-2" />Descargar Excel</Button></div></CardContent></Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Card><CardHeader><CardTitle>Gráfico 1 (Próximamente)</CardTitle></CardHeader><CardContent className="h-60 bg-slate-50 flex items-center justify-center rounded-lg"><p className="text-muted-foreground">Datos del Backend</p></CardContent></Card><Card><CardHeader><CardTitle>Gráfico 2 (Próximamente)</CardTitle></CardHeader><CardContent className="h-60 bg-slate-50 flex items-center justify-center rounded-lg"><p className="text-muted-foreground">Datos del Backend</p></CardContent></Card></div>
      <Card><CardHeader><CardTitle>Historial Detallado de Fichas</CardTitle></CardHeader><CardContent><p className="text-center text-muted-foreground py-8">La tabla con el detalle de servicios, piezas y totales aparecerá aquí.</p></CardContent></Card>
    </div>
);