import React, { useState, useEffect, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Clock, Play, Square, CheckCircle2, Plus, Minus } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { WorkOrder, WorkOrderStatus, WorkOrderService, WorkOrderPart, ServiceItem, PartItem } from '../lib/types';
import { updatePartStock } from '../services/parts';

// --- COMPONENTE PARA LA TARJETA INDIVIDUAL (WorkOrderCard) ---

interface WorkOrderCardProps {
  workOrder: WorkOrder;
  timerValue: number;
  isTimerRunning: boolean;
  isSelected: boolean;
  onSelect: (workOrder: WorkOrder | null) => void;
}

const WorkOrderCard = memo(({ workOrder, timerValue, isTimerRunning, isSelected, onSelect }: WorkOrderCardProps) => {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const translateStatus = (status: WorkOrderStatus) => {
    switch (status) {
      case 'open': return 'Abierta';
      case 'in_progress': return 'En Progreso';
      case 'ready_for_delivery': return 'Lista';
      default: return 'Finalizada';
    }
  };

  return (
    <Dialog open={isSelected} onOpenChange={(isOpen) => onSelect(isOpen ? workOrder : null)}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 mb-3 border-l-4 border-l-marchant-green">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-sm text-marchant-green">{workOrder.client?.name || 'Cliente no encontrado'}</CardTitle>
                <p className="text-xs text-muted-foreground">{workOrder.bicycle?.brand} {workOrder.bicycle?.model}</p>
              </div>
              <Badge variant={
                workOrder.status === 'open' ? 'default' :
                workOrder.status === 'in_progress' ? 'secondary' :
                'outline'
              } className={
                workOrder.status === 'open' ? 'bg-slate-500' :
                workOrder.status === 'in_progress' ? 'bg-marchant-red text-white' :
                'bg-marchant-green text-white'
              }>
                {translateStatus(workOrder.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{workOrder.description}</p>
            <div className="flex justify-between items-center mt-2 pt-2 border-t">
              <span className="text-xs text-muted-foreground">
                #{workOrder.id.slice(-6)}
              </span>
              <p className="text-sm font-semibold text-marchant-green">
                ${workOrder.totalAmount.toLocaleString()}
              </p>
            </div>
            {workOrder.estimatedDeliveryDate && (<p className="text-xs text-muted-foreground text-right mt-1">Entrega: {new Date(workOrder.estimatedDeliveryDate).toLocaleDateString()}</p>)}
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {isSelected && <WorkOrderDetail workOrder={workOrder} onClose={() => onSelect(null)} />}
      </DialogContent>
    </Dialog>
  );
});

// --- COMPONENTE PARA EL DETALLE DE LA FICHA (WorkOrderDetail) ---

const WorkOrderDetail = ({ workOrder, onClose }: { workOrder: WorkOrder, onClose: () => void }) => {
    const { state, dispatch } = useApp();
    const { currentUser } = state;

    // Estados locales para el formulario. Se inicializan con los datos de la ficha.
    const [services, setServices] = useState<WorkOrderService[]>(workOrder.services || []);
    const [parts, setParts] = useState<WorkOrderPart[]>(workOrder.parts || []);
    const [mechanicNotes, setMechanicNotes] = useState(workOrder.mechanicNotes || '');
    
    const addService = (serviceId: string) => {
      const serviceToAdd = state.services.find(s => s.id === serviceId);
      if (serviceToAdd && !services.some(s => s.serviceId === serviceId)) {
        const newService: WorkOrderService = {
          id: `wos-${Date.now()}`,
          serviceId: serviceToAdd.id,
          service: serviceToAdd,
          quantity: 1,
          price: serviceToAdd.price
        };
        setServices([...services, newService]);
      }
    };

    const addPart = (partId: string) => {
      // Buscamos la pieza en el estado global para tener el stock más actualizado
      const partToAdd = state.parts.find(p => p.id === partId);

      // Verificamos que haya stock y que la pieza no esté ya en la ficha
      if (partToAdd && partToAdd.stock > 0 && !parts.some(p => p.partId === partId)) {
        const newPart: WorkOrderPart = {
          id: `wop-${Date.now()}`,
          partId: partToAdd.id,
          part: partToAdd,
          quantity: 1,
          price: partToAdd.price
        };
        setParts([...parts, newPart]);
      }
    };

    const updateServiceQuantity = (serviceListItemId: string, quantity: number) => {
      setServices(services.map(s => {
        if (s.id === serviceListItemId) {
          const basePrice = s.service.price;
          return { ...s, quantity, price: basePrice * quantity };
        }
        return s;
      }));
    };

    const updatePartQuantity = (partListItemId: string, quantity: number) => {
      setParts(parts.map(p => {
        if (p.id === partListItemId) {
          // Solo aplicamos la lógica de stock si el usuario está AUMENTANDO la cantidad
          if (quantity > p.quantity) {
            // 1. Buscamos la cantidad original que tenía esta pieza en la ficha
            const originalPart = workOrder.parts.find(op => op.id === partListItemId);
            const originalQuantity = originalPart ? originalPart.quantity : 0;

            // 2. Obtenemos el stock MÁS ACTUALIZADO desde el estado global
            const freshPartData = state.parts.find(fp => fp.id === p.partId);
            const availableStock = freshPartData?.stock || 0;

            // 3. Calculamos cuántas piezas NUEVAS hemos añadido en esta sesión
            const newlyAddedCount = p.quantity - originalQuantity;

            // 4. Si la cantidad de piezas nuevas que ya hemos añadido es igual o mayor
            //    al stock disponible, no podemos añadir más.
            if (newlyAddedCount >= availableStock) {
              alert(`No hay más stock disponible para agregar de "${p.part.name}".`);
              return p; // Devolvemos la pieza sin cambiar la cantidad
            }
          }

          // Si la comprobación pasa (o si estamos disminuyendo la cantidad), actualizamos
          const basePrice = p.part.price;
          const newQuantity = Math.max(1, quantity);
          return { ...p, quantity: newQuantity, price: basePrice * newQuantity };
        }
        return p;
      }));
    };

    const removeService = (serviceListItemId: string) => {
      setServices(services.filter(s => s.id !== serviceListItemId));
    };

    const removePart = (partListItemId: string) => {
      setParts(parts.filter(p => p.id !== partListItemId));
    };

    const saveChanges = async () => {
        const stockUpdates = [];
        const originalParts = workOrder.parts || [];

        parts.forEach(currentPart => {
            const originalPart = originalParts.find(p => p.id === currentPart.id);
            const quantityChange = originalPart ? currentPart.quantity - originalPart.quantity : currentPart.quantity;
            if (quantityChange > 0) {
                stockUpdates.push({ partId: currentPart.part.id, quantityChange });
            }
        });

        try {
            if (stockUpdates.length > 0) {
                await updatePartStock(stockUpdates);
            }
            const totalAmount = [...services, ...parts].reduce((sum, item) => sum + item.price, 0);
            const updatedWorkOrder: WorkOrder = {
                ...workOrder,
                services,
                parts,
                totalAmount,
                mechanicNotes,
                updatedAt: new Date()
            };
            dispatch({ type: 'UPDATE_WORK_ORDER', payload: updatedWorkOrder });
            if (onClose) onClose();
        } catch (error) {
            console.error("Error al guardar cambios:", error);
            alert(`No se pudieron guardar los cambios: ${error}`);
        }
    };

    return (
      <>
        <DialogHeader>
          <DialogTitle className="text-marchant-green">Ficha de Trabajo #{workOrder.id.slice(-6)}</DialogTitle>
          <DialogDescription>{workOrder.client.name} - {workOrder.bicycle.brand} {workOrder.bicycle.model}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="p-4 bg-marchant-green-light rounded-lg"><h4 className="text-marchant-green">Descripción del Problema</h4><p className="text-sm text-muted-foreground">{workOrder.description}</p></div>
          <Separator />
          <div>
            <div className="flex justify-between items-center mb-3"><h4 className="text-marchant-green">Servicios</h4><Select onValueChange={addService}><SelectTrigger className="w-48"><SelectValue placeholder="Agregar servicio" /></SelectTrigger><SelectContent>{state.services.map(service => (<SelectItem key={service.id} value={service.id}>{service.name} - ${service.price.toLocaleString()}</SelectItem>))}</SelectContent></Select></div>
            {services.map(service => (
              <div key={service.id} className="flex items-center justify-between p-3 border-l-4 border-l-marchant-green rounded mb-2 bg-marchant-green-light">
                <div className="flex-1"><p className="text-sm">{service.service.name}</p><p className="text-xs text-muted-foreground">${(service.price / service.quantity).toLocaleString()} c/u</p></div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => updateServiceQuantity(service.id, Math.max(1, service.quantity - 1))}><Minus className="h-3 w-3" /></Button>
                  <span className="w-8 text-center text-sm">{service.quantity}</span>
                  <Button variant="outline" size="sm" onClick={() => updateServiceQuantity(service.id, service.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                  <Button variant="destructive" size="sm" onClick={() => removeService(service.id)} className="bg-marchant-red hover:bg-marchant-red-dark"><Minus className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
          </div>
          <Separator />
          <div>
            <div className="flex justify-between items-center mb-3"><h4 className="text-marchant-green">Piezas</h4><Select onValueChange={addPart}><SelectTrigger className="w-48"><SelectValue placeholder="Agregar pieza" /></SelectTrigger><SelectContent>{state.parts.map(part => (<SelectItem key={part.id} value={part.id} disabled={part.stock === 0}>{part.name} ({part.stock} disp.) - ${part.price.toLocaleString()}</SelectItem>))}</SelectContent></Select></div>
            {parts.map(part => (
              <div key={part.id} className="flex items-center justify-between p-3 border-l-4 border-l-marchant-red rounded mb-2 bg-marchant-red-light">
                <div className="flex-1"><p className="text-sm">{part.part.name}</p><p className="text-xs text-muted-foreground">${(part.price / part.quantity).toLocaleString()} c/u</p></div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => updatePartQuantity(part.id, Math.max(1, part.quantity - 1))}><Minus className="h-3 w-3" /></Button>
                  <span className="w-8 text-center text-sm">{part.quantity}</span>
                  <Button variant="outline" size="sm" onClick={() => updatePartQuantity(part.id, part.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                  <Button variant="destructive" size="sm" onClick={() => removePart(part.id)} className="bg-marchant-red hover:bg-marchant-red-dark"><Minus className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
          </div>
          <Separator />
          <div><Label htmlFor="notes" className="text-marchant-green">Notas del Mecánico</Label><Textarea id="notes" value={mechanicNotes} onChange={(e) => setMechanicNotes(e.target.value)} placeholder="Agregar notas sobre el trabajo realizado..." className="mt-1" /></div>
          <div className="flex justify-between items-center pt-4 bg-gray-50 p-4 -m-6 mt-4">
            <div><p className="text-sm">Total: <span className="text-lg font-bold text-marchant-green">${([...services, ...parts].reduce((sum, item) => sum + item.price, 0)).toLocaleString()}</span></p></div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={saveChanges} className="border-marchant-green text-marchant-green hover:bg-marchant-green-light">Guardar Cambios</Button>
              {workOrder.status === 'open' && (<Button onClick={() => dispatch({ type: 'START_WORK_ORDER', payload: { workOrderId: workOrder.id, mechanicId: currentUser!.id } })} className="bg-marchant-green hover:bg-marchant-green-dark"><Play className="h-4 w-4 mr-2" />Iniciar Trabajo</Button>)}
              {workOrder.status === 'in_progress' && (<Button onClick={() => dispatch({ type: 'COMPLETE_WORK_ORDER', payload: workOrder.id })} className="bg-marchant-red hover:bg-marchant-red-dark"><CheckCircle2 className="h-4 w-4 mr-2" />Completar</Button>)}
            </div>
          </div>
        </div>
      </>
    );
};

// --- COMPONENTE PRINCIPAL (KanbanBoard) ---

export default function KanbanBoard() {
  const { state, dispatch } = useApp();
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  
  const workOrders = state.workOrders.filter(wo => wo.status !== 'completed');
  const getWorkOrdersByStatus = (status: WorkOrderStatus) => workOrders.filter(wo => wo.status === status);
  
  const [workTimer, setWorkTimer] = useState<{ [key: string]: number }>({});
  const [isTimerRunning, setIsTimerRunning] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
      const runningTimers: { [key: string]: boolean } = {};
      state.workOrders.forEach(wo => {
          if (wo.status === 'in_progress' && wo.startedAt) {
              runningTimers[wo.id] = true;
              const secondsElapsed = Math.floor((new Date().getTime() - new Date(wo.startedAt).getTime()) / 1000);
              setWorkTimer(prev => ({...prev, [wo.id]: secondsElapsed}));
          }
      });
      setIsTimerRunning(runningTimers);
  }, [state.workOrders]);

  useEffect(() => {
    const interval = setInterval(() => {
      setWorkTimer(prev => {
        const updated = { ...prev };
        Object.keys(isTimerRunning).forEach(workOrderId => {
          if (isTimerRunning[workOrderId]) {
            updated[workOrderId] = (updated[workOrderId] || 0) + 1;
          }
        });
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const columns = [
    { status: 'open' as WorkOrderStatus, title: 'Abiertas', icon: Square, bgColor: 'bg-slate-50 border-slate-200', headerColor: 'text-slate-600' },
    { status: 'in_progress' as WorkOrderStatus, title: 'En Progreso', icon: Play, bgColor: 'bg-red-50 border-red-200', headerColor: 'text-marchant-red' },
    { status: 'ready_for_delivery' as WorkOrderStatus, title: 'Lista para Entrega', icon: CheckCircle2, bgColor: 'bg-green-50 border-green-200', headerColor: 'text-marchant-green' }
  ];

  return (
    <div className="p-4 h-full">
      <div className="mb-6 bg-gradient-to-r from-marchant-green-light to-marchant-red-light p-6 rounded-lg">
        <h2 className="text-marchant-green">Tablero de Trabajo</h2>
        <p className="text-muted-foreground">Gestiona las fichas de trabajo del taller</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-12rem)]">
        {columns.map(column => {
          const Icon = column.icon;
          const workOrdersInColumn = getWorkOrdersByStatus(column.status);
          return (
            <Card key={column.status} className={`${column.bgColor} h-full flex flex-col shadow-lg`}>
              <CardHeader className="pb-3">
                <CardTitle className={`flex items-center gap-2 text-base ${column.headerColor}`}>
                  <Icon className="h-5 w-5" />
                  {column.title}
                  <Badge variant="secondary" className="bg-white text-gray-700">{workOrdersInColumn.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                {workOrdersInColumn.length === 0 ? (
                  <div className="text-center py-8">
                    <Icon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-muted-foreground">No hay fichas en esta columna</p>
                  </div>
                ) : (
                  workOrdersInColumn.map(workOrder => (
                    <WorkOrderCard 
                      key={workOrder.id} 
                      workOrder={workOrder}
                      timerValue={workTimer[workOrder.id] || 0}
                      isTimerRunning={isTimerRunning[workOrder.id] || false}
                      isSelected={selectedWorkOrder?.id === workOrder.id}
                      onSelect={setSelectedWorkOrder}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}