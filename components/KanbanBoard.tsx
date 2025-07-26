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
import { WorkOrder, WorkOrderStatus, WorkOrderService, WorkOrderPart } from '../lib/types';

// ====================================================================
// PASO 1: Hemos movido WorkOrderCard fuera y lo hemos envuelto en React.memo
// ====================================================================

// Definimos las propiedades que necesitará nuestro componente de tarjeta
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
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog
      open={isSelected}
      onOpenChange={(isOpen) => onSelect(isOpen ? workOrder : null)}
    >
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 mb-3 border-l-4 border-l-marchant-green">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-sm text-marchant-green">{workOrder.client.name}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {workOrder.bicycle.brand} {workOrder.bicycle.model}
                </p>
              </div>
              {workOrder.status === 'in_progress' && isTimerRunning && (
                <Badge variant="secondary" className="flex items-center gap-1 bg-marchant-red text-white">
                  <Clock className="h-3 w-3" />
                  {formatTime(timerValue || 0)}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground line-clamp-2">
              {workOrder.description}
            </p>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-muted-foreground">
                #{workOrder.id.slice(-6)}
              </span>
              <Badge variant={
                workOrder.status === 'open' ? 'default' :
                workOrder.status === 'in_progress' ? 'secondary' :
                'outline'
              } className={
                workOrder.status === 'open' ? 'bg-slate-500' :
                workOrder.status === 'in_progress' ? 'bg-marchant-red text-white' :
                'bg-marchant-green text-white'
              }>
                {workOrder.status === 'open' ? 'Abierta' :
                 workOrder.status === 'in_progress' ? 'En Progreso' :
                 'Lista'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {isSelected && <WorkOrderDetail workOrder={workOrder} />}
      </DialogContent>
    </Dialog>
  );
});


// Este componente no ha cambiado, lo dejamos aquí para que todo funcione
const WorkOrderDetail = ({ workOrder }: { workOrder: WorkOrder }) => {
    const { state, dispatch } = useApp();
    const [services, setServices] = useState<WorkOrderService[]>(workOrder.services);
    const [parts, setParts] = useState<WorkOrderPart[]>(workOrder.parts);
    const [mechanicNotes, setMechanicNotes] = useState(workOrder.mechanicNotes || '');
    
    // ... El resto del código de WorkOrderDetail (largo) va aquí sin cambios ...
    const addService = (serviceId: string) => {
      const service = state.services.find(s => s.id === serviceId);
      if (service) {
        const newService: WorkOrderService = {
          id: `wos-${Date.now()}`,
          serviceId,
          service,
          quantity: 1,
          price: service.price
        };
        setServices([...services, newService]);
      }
    };
    const addPart = (partId: string) => {
      const part = state.parts.find(p => p.id === partId);
      if (part) {
        const newPart: WorkOrderPart = {
          id: `wop-${Date.now()}`,
          partId,
          part,
          quantity: 1,
          price: part.price
        };
        setParts([...parts, newPart]);
      }
    };
    const updateServiceQuantity = (serviceId: string, quantity: number) => {
      setServices(services.map(s => 
        s.id === serviceId ? { ...s, quantity, price: s.service.price * quantity } : s
      ));
    };
    const updatePartQuantity = (partId: string, quantity: number) => {
      setParts(parts.map(p => 
        p.id === partId ? { ...p, quantity, price: p.part.price * quantity } : p
      ));
    };
    const removeService = (serviceId: string) => {
      setServices(services.filter(s => s.id !== serviceId));
    };
    const removePart = (partId: string) => {
      setParts(parts.filter(p => p.id !== partId));
    };
    const saveChanges = () => {
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
    };

    return (
      <>
        <DialogHeader>
          <DialogTitle className="text-marchant-green">
            Ficha de Trabajo #{workOrder.id.slice(-6)}
          </DialogTitle>
          <DialogDescription>
            {workOrder.client.name} - {workOrder.bicycle.brand} {workOrder.bicycle.model}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-marchant-green-light rounded-lg">
            <h4 className="text-marchant-green">Descripción del Problema</h4>
            <p className="text-sm text-muted-foreground">{workOrder.description}</p>
          </div>
          <Separator />
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-marchant-green">Servicios</h4>
              <Select onValueChange={addService}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Agregar servicio" />
                </SelectTrigger>
                <SelectContent>
                  {state.services.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} - ${service.price.toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {services.map(service => (
              <div key={service.id} className="flex items-center justify-between p-3 border-l-4 border-l-marchant-green rounded mb-2 bg-marchant-green-light">
                <div className="flex-1">
                  <p className="text-sm">{service.service.name}</p>
                  <p className="text-xs text-muted-foreground">${service.service.price.toLocaleString()} c/u</p>
                </div>
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
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-marchant-green">Piezas</h4>
              <Select onValueChange={addPart}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Agregar pieza" />
                </SelectTrigger>
                <SelectContent>
                  {state.parts.map(part => (
                    <SelectItem key={part.id} value={part.id}>
                      {part.name} - ${part.price.toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {parts.map(part => (
              <div key={part.id} className="flex items-center justify-between p-3 border-l-4 border-l-marchant-red rounded mb-2 bg-marchant-red-light">
                <div className="flex-1">
                  <p className="text-sm">{part.part.name}</p>
                  <p className="text-xs text-muted-foreground">${part.part.price.toLocaleString()} c/u</p>
                </div>
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
          <div>
            <Label htmlFor="notes" className="text-marchant-green">Notas del Mecánico</Label>
            <Textarea id="notes" value={mechanicNotes} onChange={(e) => setMechanicNotes(e.target.value)} placeholder="Agregar notas sobre el trabajo realizado..." className="mt-1" />
          </div>
          <div className="flex justify-between items-center pt-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <p className="text-sm">Total: <span className="text-lg text-marchant-green">${([...services, ...parts].reduce((sum, item) => sum + item.price, 0)).toLocaleString()}</span></p>
              {workOrder.workTimeMinutes && (
                <p className="text-xs text-muted-foreground">
                  Tiempo trabajado: {Math.floor(workOrder.workTimeMinutes / 60)}h {workOrder.workTimeMinutes % 60}m
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={saveChanges} className="border-marchant-green text-marchant-green hover:bg-marchant-green-light">Guardar Cambios</Button>
              {workOrder.status === 'open' && (
                <Button onClick={() => {
                  const { state: appState, dispatch: appDispatch } = useApp();
                  if (appState.currentUser) {
                    appDispatch({ type: 'START_WORK_ORDER', payload: { workOrderId: workOrder.id, mechanicId: appState.currentUser.id } });
                  }
                }} className="bg-marchant-green hover:bg-marchant-green-dark"><Play className="h-4 w-4 mr-2" />Iniciar Trabajo</Button>
              )}
              {workOrder.status === 'in_progress' && (
                <Button onClick={() => dispatch({ type: 'COMPLETE_WORK_ORDER', payload: workOrder.id })} className="bg-marchant-red hover:bg-marchant-red-dark"><CheckCircle2 className="h-4 w-4 mr-2" />Completar</Button>
              )}
            </div>
          </div>
        </div>
      </>
    );
};


// ====================================================================
// PASO 2: El componente principal KanbanBoard ahora usa la tarjeta optimizada
// ====================================================================
export default function KanbanBoard() {
  const { state, dispatch } = useApp();
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [workTimer, setWorkTimer] = useState<{ [key: string]: number }>({});
  const [isTimerRunning, setIsTimerRunning] = useState<{ [key: string]: boolean }>({});

  const workOrders = state.workOrders.filter(wo => wo.status !== 'completed');

  const getWorkOrdersByStatus = (status: WorkOrderStatus) => {
    return workOrders.filter(wo => wo.status === status);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setWorkTimer(prev => {
        const updated = { ...prev };
        Object.keys(isTimerRunning).forEach(workOrderId => {
          if (isTimerRunning[workOrderId]) {
            updated[workOrderId] = (updated[workOrderId] || 0) + 1;
            if (updated[workOrderId] % 60 === 0) {
              dispatch({ 
                type: 'UPDATE_WORK_TIME', 
                payload: { workOrderId, minutes: Math.floor(updated[workOrderId] / 60) }
              });
            }
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, dispatch]);
  
  // Sincronizar el estado del timer con los datos que vienen del AppContext
  useEffect(() => {
      const runningTimers: { [key: string]: boolean } = {};
      state.workOrders.forEach(wo => {
          if (wo.status === 'in_progress') {
              runningTimers[wo.id] = true;
          }
      });
      setIsTimerRunning(runningTimers);
  }, [state.workOrders]);


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
                  <Badge variant="secondary" className="bg-white text-gray-700">
                    {workOrdersInColumn.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                {workOrdersInColumn.length === 0 ? (
                  <div className="text-center py-8">
                    <Icon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No hay fichas en esta columna
                    </p>
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