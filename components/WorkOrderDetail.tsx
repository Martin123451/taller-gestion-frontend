import React, { useState, useEffect } from 'react';
import { useApp } from './../contexts/AppContext';
import { useAuthContext } from './../contexts/AuthContext';
import { WorkOrder, WorkOrderService, WorkOrderPart, PartItem } from './../lib/types';
import { getParts, updatePartStock } from './../services/parts';

import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Badge } from './ui/badge';
import { Play, CheckCircle2, Plus, Minus, AlertTriangle, XCircle, Clock } from 'lucide-react';

interface WorkOrderDetailProps {
  workOrder: WorkOrder;
  onClose: () => void;
}

interface StockUpdate {
  partId: string;
  quantityChange: number;
}

export default function WorkOrderDetail({ workOrder, onClose }: WorkOrderDetailProps) {
    const { state, dispatch } = useApp();
    const { currentUser } = useAuthContext();

    const [services, setServices] = useState<WorkOrderService[]>(workOrder.services || []);
    const [parts, setParts] = useState<WorkOrderPart[]>(workOrder.parts || []);
    const [mechanicNotes, setMechanicNotes] = useState(workOrder.mechanicNotes || '');

    const [freshParts, setFreshParts] = useState<PartItem[] | null>(null);
    const [isLoadingParts, setIsLoadingParts] = useState(true);

    useEffect(() => {
      const fetchFreshParts = async () => {
        try {
          setIsLoadingParts(true);
          const partsFromDB = await getParts();
          setFreshParts(partsFromDB);
        } catch (error) {
          console.error("Error al obtener el inventario actualizado:", error);
          setFreshParts(state.parts);
        } finally {
          setIsLoadingParts(false);
        }
      };

      fetchFreshParts();
    }, [state.parts]);

    const handleStartWorkOrder = () => {
    
        if (!currentUser) {
          alert('Error: No se ha podido identificar al usuario. Por favor, recarga la página e intenta de nuevo.');
          return;
        }
    
        const payload = {
          workOrderId: workOrder.id,
          mechanicId: currentUser.id,
          mechanic: currentUser
        };
        
        if (!payload.mechanicId) {
            alert('Error: El ID del mecánico es indefinido. No se puede iniciar el trabajo.');
            return;
        }

        dispatch({ type: 'START_WORK_ORDER', payload });
      };

    const addService = (serviceId: string) => {
      const serviceToAdd = state.services.find(s => s.id === serviceId);
      if (serviceToAdd && !services.some(s => s.serviceId === serviceId)) {
        const newService: WorkOrderService = {
          id: `wos-${Date.now()}`,
          serviceId: serviceToAdd.id,
          service: serviceToAdd,
          quantity: 1,
          price: serviceToAdd.price,
          createdAt: new Date()
        };
        setServices([...services, newService]);
      }
    };

    const addPart = (partId: string) => {
      const partToAdd = freshParts?.find(p => p.id === partId);
      if (partToAdd && partToAdd.stock > 0 && !parts.some(p => p.partId === partId)) {
        const newPart: WorkOrderPart = {
          id: `wop-${Date.now()}`,
          partId: partToAdd.id,
          part: partToAdd,
          quantity: 1,
          price: partToAdd.price,
          createdAt: new Date()
        };
        setParts([...parts, newPart]);
      }
    };

    const updateServiceQuantity = (serviceListItemId: string, quantity: number) => {
      setServices(services.map(s => {
        if (s.id === serviceListItemId) {
          const basePrice = s.service?.price || 0;
          return { ...s, quantity, price: basePrice * quantity };
        }
        return s;
      }));
    };

    const updatePartQuantity = (partListItemId: string, quantity: number) => {
      setParts(parts.map(p => {
        if (p.id === partListItemId) {
          if (quantity > p.quantity) {
            const originalPart = workOrder.parts.find(op => op.id === partListItemId);
            const originalQuantity = originalPart ? originalPart.quantity : 0;
            const freshPartData = freshParts?.find(fp => fp.id === p.partId);
            const availableStock = freshPartData?.stock || 0;
            const newlyAddedCount = p.quantity - originalQuantity;
            if (newlyAddedCount >= availableStock) {
              alert(`No hay más stock disponible para agregar de "${p.part?.name}".`);
              return p;
            }
          }
          const basePrice = p.part?.price || 0;
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
        const stockUpdates: StockUpdate[] = [];
        const originalParts = workOrder.parts || [];

        parts.forEach(currentPart => {
            const originalPart = originalParts.find(p => p.partId === currentPart.partId);
            const originalQuantity = originalPart ? originalPart.quantity : 0;
            const quantityChange = currentPart.quantity - originalQuantity;

            if (quantityChange !== 0) {
                stockUpdates.push({ partId: currentPart.partId, quantityChange: quantityChange });
            }
        });
        
        originalParts.forEach(originalPart => {
            const currentPart = parts.find(p => p.partId === originalPart.partId);
            if (!currentPart) {
                stockUpdates.push({ partId: originalPart.partId, quantityChange: -originalPart.quantity });
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

            if (workOrder.status === 'open') {
                updatedWorkOrder.originalServices = services;
                updatedWorkOrder.originalParts = parts;
                updatedWorkOrder.originalAmount = totalAmount;
                updatedWorkOrder.needsQuote = false;
            } else if (workOrder.status === 'in_progress') {
                const originalItemCount = (workOrder.originalServices?.length || 0) + (workOrder.originalParts?.length || 0);
                const currentItemCount = services.length + parts.length;

                if (currentItemCount > originalItemCount) {
                    updatedWorkOrder.needsQuote = true;
                }
            }

            dispatch({ type: 'UPDATE_WORK_ORDER', payload: updatedWorkOrder });
            
            const updatedPartsFromDB = await getParts();
            dispatch({ type: 'SET_PARTS', payload: updatedPartsFromDB });
            
            if (onClose) onClose();

        } catch (error) {
            console.error("Error al guardar cambios:", error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            alert(`No se pudieron guardar los cambios: ${errorMessage}`);
        }
    };

    const totalAmount = [...services, ...parts].reduce((sum, item) => sum + item.price, 0);

    const hasQuotePending = workOrder.needsQuote && (!workOrder.quote || workOrder.quote.status === 'pending' || workOrder.quote.status === 'sent');
    const canComplete = !hasQuotePending;
    
    const getQuoteStatus = () => {
      if (!workOrder.needsQuote) return null;
      if (!workOrder.quote) return 'pending';
      return workOrder.quote.status;
    };

    const isItemRejected = (itemId: string, itemType: 'service' | 'part') => {
      if (!workOrder.quote?.rejectedItems) return false;
      const rejectedIds = itemType === 'service' 
        ? workOrder.quote.rejectedItems.services || []
        : workOrder.quote.rejectedItems.parts || [];
      return rejectedIds.includes(itemId);
    };

    const getItemStatus = (itemId: string, itemType: 'service' | 'part') => {
      const quoteStatus = getQuoteStatus();
      if (!quoteStatus || quoteStatus === 'pending' || quoteStatus === 'sent') {
        return 'pending';
      }
      if (quoteStatus === 'approved') return 'approved';
      if (quoteStatus === 'rejected') return 'rejected';
      if (quoteStatus === 'partial_reject') {
        return isItemRejected(itemId, itemType) ? 'rejected' : 'approved';
      }
      return 'pending';
    };

    const isOriginalItem = (itemId: string, itemType: 'service' | 'part') => {
      const originalItems = itemType === 'service' 
        ? (workOrder.originalServices || [])
        : (workOrder.originalParts || []);
      return originalItems.some(item => item.id === itemId);
    };

    const getItemBadge = (itemId: string, itemType: 'service' | 'part') => {
      const isOriginal = isOriginalItem(itemId, itemType);
      if (isOriginal) {
        return <Badge variant="outline" className="text-xs bg-gray-100">ORIGINAL</Badge>;
      }
      
      const status = getItemStatus(itemId, itemType);
      switch (status) {
        case 'approved':
          return <Badge variant="outline" className="text-xs bg-green-100 text-green-700">HACER</Badge>;
        case 'rejected':
          return <Badge variant="destructive" className="text-xs bg-red-100 text-red-700">NO HACER</Badge>;
        case 'pending':
          return <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-700">PENDIENTE</Badge>;
        default:
          return null;
      }
    };

    return (
      <>
        <DialogHeader>
          <DialogTitle className="text-marchant-green">Ficha de Trabajo #{workOrder.id.slice(-6)}</DialogTitle>
          <DialogDescription>
            {workOrder.client?.name || 'Cliente no asignado'} - {workOrder.bicycle?.brand || 'Marca no especificada'} {workOrder.bicycle?.model || ''}
          </DialogDescription>
        </DialogHeader>

        {workOrder.needsQuote && (
          <div className="p-4 border rounded-lg bg-blue-50 border-blue-200 mt-4">
            <div className="flex items-center gap-2 mb-2">
              {getQuoteStatus() === 'pending' && <Clock className="h-4 w-4 text-yellow-600" />}
              {getQuoteStatus() === 'sent' && <Clock className="h-4 w-4 text-blue-600" />}
              {getQuoteStatus() === 'approved' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              {getQuoteStatus() === 'rejected' && <XCircle className="h-4 w-4 text-red-600" />}
              {getQuoteStatus() === 'partial_reject' && <AlertTriangle className="h-4 w-4 text-orange-600" />}
              <h4 className="font-medium">Estado de Cotización</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              {getQuoteStatus() === 'pending' && 'Cotización pendiente - esperando respuesta del administrador'}
              {getQuoteStatus() === 'sent' && 'Cotización enviada al cliente - esperando respuesta'}
              {getQuoteStatus() === 'approved' && 'Cotización aprobada - realizar todos los trabajos adicionales'}
              {getQuoteStatus() === 'rejected' && 'Cotización rechazada - solo realizar trabajo original'}
              {getQuoteStatus() === 'partial_reject' && 'Rechazo parcial - revisar qué trabajos realizar'}
            </p>
          </div>
        )}

        <div className="space-y-4 pt-4">
          <div className="p-4 bg-marchant-green-light rounded-lg">
            <h4 className="text-marchant-green">Descripción del Problema</h4>
            <p className="text-sm text-muted-foreground">{workOrder.description}</p>
          </div>
          <Separator />
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-marchant-green">Servicios</h4>
              <Select onValueChange={addService}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Agregar servicio" /></SelectTrigger>
                <SelectContent>{state.services.map(service => (<SelectItem key={service.id} value={service.id}>{service.name} - ${service.price.toLocaleString()}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            {services.map(service => (
              <div key={service.id} className="flex items-center justify-between p-3 border-l-4 border-l-marchant-green rounded mb-2 bg-marchant-green-light">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm">{service.service?.name || 'Servicio no encontrado'}</p>
                    {getItemBadge(service.id, 'service')}
                  </div>
                  <p className="text-xs text-muted-foreground">${(service.price / service.quantity).toLocaleString()} c/u</p>
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
              <Select onValueChange={addPart} disabled={isLoadingParts}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={isLoadingParts ? "Cargando..." : "Agregar pieza"} />
                </SelectTrigger>
                <SelectContent>
                  {freshParts?.map(part => (
                    <SelectItem key={part.id} value={part.id} disabled={part.stock === 0}>
                      {part.name} ({part.stock} disp.) - ${part.price.toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {parts.map(part => (
              <div key={part.id} className="flex items-center justify-between p-3 border-l-4 border-l-marchant-red rounded mb-2 bg-marchant-red-light">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm">{part.part?.name || 'Pieza no encontrada'}</p>
                    {getItemBadge(part.id, 'part')}
                  </div>
                  <p className="text-xs text-muted-foreground">${(part.price / part.quantity).toLocaleString()} c/u</p>
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
          <div className="flex justify-between items-center pt-4 bg-gray-50 p-4 -m-6 mt-4">
            <div>
              <p className="text-sm">Total: <span className="text-lg font-bold text-marchant-green">${totalAmount.toLocaleString()}</span></p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={saveChanges} className="border-marchant-green text-marchant-green hover:bg-marchant-green-light">Guardar Cambios</Button>
              {workOrder.status === 'open' && (
                <Button 
                  onClick={handleStartWorkOrder} 
                  disabled={!currentUser}
                  className="bg-marchant-green hover:bg-marchant-green-dark"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar Trabajo
                </Button>
              )}
              {workOrder.status === 'in_progress' && (
                <Button 
                  onClick={() => dispatch({ type: 'COMPLETE_WORK_ORDER', payload: workOrder.id })} 
                  disabled={!canComplete}
                  className={`${canComplete 
                    ? 'bg-marchant-red hover:bg-marchant-red-dark' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  title={!canComplete ? 'No se puede completar hasta que la cotización sea respondida' : ''}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Completar
                </Button>
              )}
            </div>
          </div>
        </div>
      </>
    );
};