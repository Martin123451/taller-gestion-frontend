import React, { useState, useEffect, useMemo } from 'react';
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
import ServiceSearchCombobox from './ServiceSearchCombobox';
import PartSearchCombobox from './PartSearchCombobox';
import { Play, CheckCircle2, Plus, Minus, AlertTriangle, XCircle, Clock } from 'lucide-react';

interface WorkOrderDetailProps {
  workOrder: WorkOrder;
  onClose: () => void;
  readOnly?: boolean;
}

interface StockUpdate {
  partId: string;
  quantityChange: number;
}

export default function WorkOrderDetail({ workOrder, onClose, readOnly = false }: WorkOrderDetailProps) {
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
          
          // Si es un item con aprobación parcial, usar cantidad aprobada
          const approvedServices = workOrder.quote?.approvedItems?.services || [];
          const approvedItem = approvedServices.find(approvedService => 
            approvedService.id === serviceListItemId
          );
          const approvedQuantity = approvedItem?.approvedQuantity;
          
          const displayQuantity = approvedQuantity !== undefined ? approvedQuantity : quantity;
          const displayPrice = basePrice * displayQuantity;
          
          return { ...s, quantity: displayQuantity, price: displayPrice };
        }
        return s;
      }));
    };

    const updatePartQuantity = (partListItemId: string, quantity: number) => {
      setParts(parts.map(p => {
        if (p.id === partListItemId) {
          if (quantity > p.quantity) {
            // Buscar la parte original para verificar stock disponible
            const originalPart = workOrder.parts?.find(op => op.id === partListItemId);
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
          
          // Si es un item con aprobación parcial, usar cantidad aprobada
          const approvedParts = workOrder.quote?.approvedItems?.parts || [];
          const approvedItem = approvedParts.find(approvedPart => 
            approvedPart.id === partListItemId
          );
          const approvedQuantity = approvedItem?.approvedQuantity;
          
          const displayQuantity = approvedQuantity !== undefined ? approvedQuantity : newQuantity;
          const displayPrice = basePrice * displayQuantity;
          
          return { ...p, quantity: displayQuantity, price: displayPrice };
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
            // Usar el total que ya está calculado considerando items rechazados
            const calculatedTotal = [...services, ...parts].reduce((sum, item) => sum + item.price, 0);
            
            const updatedWorkOrder: WorkOrder = {
                ...workOrder,
                services,
                parts,
                totalAmount: calculatedTotal,
                mechanicNotes,
                updatedAt: new Date()
            };

            if (workOrder.status === 'open') {
                updatedWorkOrder.originalServices = services;
                updatedWorkOrder.originalParts = parts;
                updatedWorkOrder.originalAmount = calculatedTotal;
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

    // Funciones necesarias para el cálculo de total
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

    const isOriginalItem = (itemId: string, itemType: 'service' | 'part') => {
      const originalItems = itemType === 'service' 
        ? (workOrder.originalServices || [])
        : (workOrder.originalParts || []);
      return originalItems.some(item => item.id === itemId);
    };

    // Función para obtener la cantidad efectiva de un item (considerando aprobaciones parciales)
    const getEffectiveQuantity = (itemId: string, itemType: 'service' | 'part', originalQuantity: number) => {
        const quoteStatus = getQuoteStatus();
        
        // Si no hay cotización o no está en aprobación parcial, usar cantidad original
        if (!quoteStatus || quoteStatus !== 'partial_reject' || !workOrder.quote?.approvedItems) {
            return originalQuantity;
        }
        
        // Si es aprobación parcial, usar cantidad aprobada
        const approvedItems = itemType === 'service' 
            ? workOrder.quote.approvedItems.services 
            : workOrder.quote.approvedItems.parts;
            
        const approvedItem = approvedItems.find(item => item.id === itemId);
        return approvedItem ? approvedItem.approvedQuantity : 0;
    };

    // Calcular el total excluyendo items rechazados usando useMemo
    const totalAmount = useMemo(() => {
        const quoteStatus = getQuoteStatus();
        
        // Si no hay cotización o está pendiente/enviada, mostrar el total completo
        if (!quoteStatus || quoteStatus === 'pending' || quoteStatus === 'sent') {
            return [...services, ...parts].reduce((sum, item) => sum + item.price, 0);
        }
        
        // Si la cotización fue rechazada completamente, usar solo items originales
        if (quoteStatus === 'rejected') {
            const approvedServices = services.filter(s => isOriginalItem(s.id, 'service'));
            const approvedParts = parts.filter(p => isOriginalItem(p.id, 'part'));
            return [...approvedServices, ...approvedParts].reduce((sum, item) => sum + item.price, 0);
        }
        
        // Si es aprobación parcial, usar cantidades aprobadas reales
        if (quoteStatus === 'partial_reject') {
            let total = 0;
            
            // Servicios: sumar originales + aprobados adicionales con cantidades reales
            services.forEach(service => {
                if (isOriginalItem(service.id, 'service')) {
                    total += service.price; // Items originales siempre cuentan
                } else {
                    const effectiveQuantity = getEffectiveQuantity(service.id, 'service', service.quantity);
                    const unitPrice = service.quantity > 0 ? service.price / service.quantity : 0;
                    total += unitPrice * effectiveQuantity;
                }
            });
            
            // Piezas: sumar originales + aprobadas adicionales con cantidades reales
            parts.forEach(part => {
                if (isOriginalItem(part.id, 'part')) {
                    total += part.price; // Items originales siempre cuentan
                } else {
                    const effectiveQuantity = getEffectiveQuantity(part.id, 'part', part.quantity);
                    const unitPrice = part.quantity > 0 ? part.price / part.quantity : 0;
                    total += unitPrice * effectiveQuantity;
                }
            });
            
            return total;
        }
        
        // Si está aprobada, incluir todo
        return [...services, ...parts].reduce((sum, item) => sum + item.price, 0);
    }, [services, parts, workOrder.quote, workOrder.needsQuote, workOrder.originalServices, workOrder.originalParts]);

    const hasQuotePending = workOrder.needsQuote && (!workOrder.quote || workOrder.quote.status === 'pending' || workOrder.quote.status === 'sent');
    const canComplete = !hasQuotePending;

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

    // Función para obtener colores de card según estado del item
    const getItemCardClasses = (itemId: string, itemType: 'service' | 'part') => {
      const isOriginal = isOriginalItem(itemId, itemType);
      
      if (isOriginal) {
        // Items originales siempre en gris
        return {
          border: 'border-l-gray-400',
          background: 'bg-gray-50'
        };
      }
      
      // En modo solo lectura, items adicionales usan colores suaves pero visibles
      if (readOnly) {
        return {
          border: 'border-l-blue-400',
          background: 'bg-blue-50'
        };
      }
      
      const status = getItemStatus(itemId, itemType);
      switch (status) {
        case 'approved':
          return {
            border: 'border-l-green-500',
            background: 'bg-green-50'
          };
        case 'rejected':
          return {
            border: 'border-l-red-500',
            background: 'bg-red-50'
          };
        case 'pending':
          return {
            border: 'border-l-orange-500',
            background: 'bg-orange-50'
          };
        default:
          return {
            border: 'border-l-gray-400',
            background: 'bg-gray-50'
          };
      }
    };


    const getItemBadge = (itemId: string, itemType: 'service' | 'part') => {
      // En modo solo lectura, no mostrar badges internos del taller
      if (readOnly) {
        return null;
      }
      
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

        {workOrder.needsQuote && !readOnly && (
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
              {getQuoteStatus() === 'partial_reject' && 'Aprobación parcial - revisar qué trabajos realizar'}
            </p>
          </div>
        )}

        <div className="space-y-4 pt-4">
          <div className="p-4 bg-marchant-green-light rounded-lg">
            <h4 className="text-marchant-green">Descripción del Trabajo</h4>
            <p className="text-sm text-muted-foreground">{workOrder.description}</p>
          </div>
          <Separator />
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-marchant-green">Servicios</h4>
              {!readOnly && (
                <ServiceSearchCombobox
                  services={state.services || []}
                  selectedServices={services.map(s => s.serviceId)}
                  onSelectService={addService}
                  placeholder="Buscar y agregar servicio..."
                  className="w-64"
                />
              )}
            </div>
            {services.map(service => {
              const cardClasses = getItemCardClasses(service.id, 'service');
              const effectiveQuantity = getEffectiveQuantity(service.id, 'service', service.quantity);
              const isPartiallyApproved = getQuoteStatus() === 'partial_reject' && !isOriginalItem(service.id, 'service');
              const canEdit = !readOnly && (getQuoteStatus() !== 'partial_reject' || isOriginalItem(service.id, 'service'));
              
              return (
                <div key={service.id} className={`flex items-center justify-between p-3 border-l-4 ${cardClasses.border} rounded mb-2 ${cardClasses.background}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm">{service.service?.name || 'Servicio no encontrado'}</p>
                    {getItemBadge(service.id, 'service')}
                    {!readOnly && isPartiallyApproved && effectiveQuantity !== service.quantity && (
                      <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700">
                        Aprobado: {effectiveQuantity}/{service.quantity}
                      </Badge>
                    )}
                  </div>
                  {readOnly && !isOriginalItem(service.id, 'service') ? (
                    // Para items adicionales en modo solo lectura, mostrar precio total por cantidad aprobada
                    <p className="text-xs text-muted-foreground">Total: ${((service.price / service.quantity) * effectiveQuantity).toLocaleString()}</p>
                  ) : (
                    // Para items originales o modo normal, mostrar precio unitario
                    <p className="text-xs text-muted-foreground">${(service.price / service.quantity).toLocaleString()} c/u</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {canEdit ? (
                    <>
                      <Button variant="outline" size="sm" onClick={() => updateServiceQuantity(service.id, Math.max(1, service.quantity - 1))}><Minus className="h-3 w-3" /></Button>
                      <span className="w-8 text-center text-sm">{service.quantity}</span>
                      <Button variant="outline" size="sm" onClick={() => updateServiceQuantity(service.id, service.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                      <Button variant="destructive" size="sm" onClick={() => removeService(service.id)} className="bg-marchant-red hover:bg-marchant-red-dark"><Minus className="h-3 w-3" /></Button>
                    </>
                  ) : (
                    <>
                      {isOriginalItem(service.id, 'service') ? (
                        // Para items originales, siempre mostrar cantidad original
                        <span className="w-8 text-center text-sm">{service.quantity}</span>
                      ) : readOnly ? (
                        // Para items adicionales en modo solo lectura, mostrar cantidad aprobada
                        <span className="w-8 text-center text-sm">{effectiveQuantity}</span>
                      ) : (
                        // Para items nuevos con aprobación parcial, mostrar cantidad aprobada
                        <>
                          <span className="text-xs text-muted-foreground">Cantidad aprobada:</span>
                          <span className="w-8 text-center text-sm font-bold text-green-600">{effectiveQuantity}</span>
                          <span className="text-xs text-muted-foreground">de {service.quantity}</span>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
              );
            })}
          </div>
          <Separator />
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-marchant-green">Piezas</h4>
              {!readOnly && (
                <PartSearchCombobox
                  parts={freshParts || []}
                  selectedParts={parts.map(p => p.partId)}
                  onSelectPart={addPart}
                  placeholder={isLoadingParts ? "Cargando..." : "Buscar y agregar pieza..."}
                  className="w-64"
                />
              )}
            </div>
            {parts.map(part => {
              const cardClasses = getItemCardClasses(part.id, 'part');
              const effectiveQuantity = getEffectiveQuantity(part.id, 'part', part.quantity);
              const isPartiallyApproved = getQuoteStatus() === 'partial_reject' && !isOriginalItem(part.id, 'part');
              const canEdit = !readOnly && (getQuoteStatus() !== 'partial_reject' || isOriginalItem(part.id, 'part'));
              
              return (
                <div key={part.id} className={`flex items-center justify-between p-3 border-l-4 ${cardClasses.border} rounded mb-2 ${cardClasses.background}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm">{part.part?.name || 'Pieza no encontrada'}</p>
                    {getItemBadge(part.id, 'part')}
                    {!readOnly && isPartiallyApproved && effectiveQuantity !== part.quantity && (
                      <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700">
                        Aprobado: {effectiveQuantity}/{part.quantity}
                      </Badge>
                    )}
                  </div>
                  {readOnly && !isOriginalItem(part.id, 'part') ? (
                    // Para items adicionales en modo solo lectura, mostrar precio total por cantidad aprobada
                    <p className="text-xs text-muted-foreground">Total: ${((part.price / part.quantity) * effectiveQuantity).toLocaleString()}</p>
                  ) : (
                    // Para items originales o modo normal, mostrar precio unitario
                    <p className="text-xs text-muted-foreground">${(part.price / part.quantity).toLocaleString()} c/u</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {canEdit ? (
                    <>
                      <Button variant="outline" size="sm" onClick={() => updatePartQuantity(part.id, Math.max(1, part.quantity - 1))}><Minus className="h-3 w-3" /></Button>
                      <span className="w-8 text-center text-sm">{part.quantity}</span>
                      <Button variant="outline" size="sm" onClick={() => updatePartQuantity(part.id, part.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                      <Button variant="destructive" size="sm" onClick={() => removePart(part.id)} className="bg-marchant-red hover:bg-marchant-red-dark"><Minus className="h-3 w-3" /></Button>
                    </>
                  ) : (
                    <>
                      {isOriginalItem(part.id, 'part') ? (
                        // Para items originales, siempre mostrar cantidad original
                        <span className="w-8 text-center text-sm">{part.quantity}</span>
                      ) : readOnly ? (
                        // Para items adicionales en modo solo lectura, mostrar cantidad aprobada
                        <span className="w-8 text-center text-sm">{effectiveQuantity}</span>
                      ) : (
                        // Para items nuevos con aprobación parcial, mostrar cantidad aprobada
                        <>
                          <span className="text-xs text-muted-foreground">Cantidad aprobada:</span>
                          <span className="w-8 text-center text-sm font-bold text-green-600">{effectiveQuantity}</span>
                          <span className="text-xs text-muted-foreground">de {part.quantity}</span>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
              );
            })}
          </div>
          <Separator />
          <div>
            <Label htmlFor="notes" className="text-marchant-green">Notas del Mecánico</Label>
            <Textarea 
              id="notes" 
              value={mechanicNotes} 
              onChange={readOnly ? undefined : (e) => setMechanicNotes(e.target.value)} 
              placeholder={readOnly ? "" : "Agregar notas sobre el trabajo realizado..."} 
              className="mt-1" 
              readOnly={readOnly}
            />
          </div>
          <div className="flex justify-between items-center pt-4 bg-gray-50 p-4 -m-6 mt-4">
            <div>
              <p className="text-sm">Total: <span className="text-lg font-bold text-marchant-green">${totalAmount.toLocaleString()}</span></p>
            </div>
            {!readOnly && (
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
            )}
          </div>
        </div>
      </>
    );
};