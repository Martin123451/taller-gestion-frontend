import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { CheckCircle2, XCircle, Send, Search, DollarSign, ChevronDown, AlertTriangle } from 'lucide-react';
import { WorkOrder, WorkOrderService, WorkOrderPart } from '../lib/types';
import { useApp } from '../contexts/AppContext';

interface QuoteDetailDialogProps {
  workOrder: WorkOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function QuoteDetailDialog({ workOrder, open, onOpenChange }: QuoteDetailDialogProps) {
  const { dispatch } = useApp();
  const [responseNotes, setResponseNotes] = React.useState('');
  const [showPartialApprovalModal, setShowPartialApprovalModal] = React.useState(false);
  const [selectedApprovedItems, setSelectedApprovedItems] = React.useState<{
    services: Array<{ id: string; approvedQuantity: number }>;
    parts: Array<{ id: string; approvedQuantity: number }>;
  }>({ services: [], parts: [] });

  // ====================================================================
  // ESTA ES LA LÓGICA CORREGIDA
  // ====================================================================
  // Si la ficha no necesita cotización, todos los ítems son originales.
  const allItemsAreOriginal = workOrder.needsQuote === false;

  const originalServices = allItemsAreOriginal ? workOrder.services : (workOrder.originalServices || []);
  const originalParts = allItemsAreOriginal ? workOrder.parts : (workOrder.originalParts || []);

  // Si todos son originales, no hay ítems nuevos.
  const newServices = allItemsAreOriginal ? [] : workOrder.services.filter(s => !originalServices.some(os => os.id === s.id));
  const newParts = allItemsAreOriginal ? [] : workOrder.parts.filter(p => !originalParts.some(op => op.id === p.id));
  // ====================================================================

  const getQuoteStatus = () => workOrder.quote?.status || 'pending';
  const quoteStatus = getQuoteStatus();

  const originalAmount = workOrder.originalAmount || 0;
  // Calcular el monto adicional real (sin items rechazados)
  const additionalAmount = workOrder.totalAmount - originalAmount;
  
  // Calcular el monto rechazado si hay aprobación parcial
  const rejectedAmount = (() => {
    if (quoteStatus !== 'partial_reject' || !workOrder.quote?.rejectedItems) return 0;
    
    const rejectedServices = newServices.filter(s => 
      workOrder.quote!.rejectedItems!.services?.includes(s.id)
    );
    const rejectedParts = newParts.filter(p => 
      workOrder.quote!.rejectedItems!.parts?.includes(p.id)
    );
    
    const rejectedServicesTotal = rejectedServices.reduce((sum, s) => sum + s.price, 0);
    const rejectedPartsTotal = rejectedParts.reduce((sum, p) => sum + p.price, 0);
    
    return rejectedServicesTotal + rejectedPartsTotal;
  })();

  // Función para compatibilidad hacia atrás con rejectedItems
  const isItemRejected = (itemId: string, itemType: 'service' | 'part') => {
    if (!workOrder.quote?.rejectedItems) return false;
    const rejectedIds = itemType === 'service' 
      ? workOrder.quote.rejectedItems.services || []
      : workOrder.quote.rejectedItems.parts || [];
    return rejectedIds.includes(itemId);
  };

  // Nuevas funciones para manejar items aprobados
  const getApprovedQuantity = (itemId: string, itemType: 'service' | 'part', originalQuantity: number) => {
    if (!workOrder.quote?.approvedItems) {
      // Si no hay approvedItems, usar lógica legacy
      if (quoteStatus === 'approved') return originalQuantity;
      if (quoteStatus === 'rejected') return 0;
      if (quoteStatus === 'partial_reject') {
        return isItemRejected(itemId, itemType) ? 0 : originalQuantity;
      }
      return originalQuantity;
    }

    const approvedItems = itemType === 'service' 
      ? workOrder.quote.approvedItems.services 
      : workOrder.quote.approvedItems.parts;
    
    const approvedItem = approvedItems.find(item => item.id === itemId);
    return approvedItem ? approvedItem.approvedQuantity : 0;
  };

  const isItemFullyApproved = (itemId: string, itemType: 'service' | 'part', originalQuantity: number) => {
    return getApprovedQuantity(itemId, itemType, originalQuantity) === originalQuantity;
  };

  const isItemPartiallyApproved = (itemId: string, itemType: 'service' | 'part', originalQuantity: number) => {
    const approvedQty = getApprovedQuantity(itemId, itemType, originalQuantity);
    return approvedQty > 0 && approvedQty < originalQuantity;
  };

  const isItemFullyRejected = (itemId: string, itemType: 'service' | 'part', originalQuantity: number) => {
    return getApprovedQuantity(itemId, itemType, originalQuantity) === 0;
  };

  const getItemBackgroundColor = (isNew: boolean, itemId?: string, itemType?: 'service' | 'part') => {
    if (!isNew) return 'bg-slate-50 border-slate-200';
    
    // Si es aprobación parcial, verificar si este item específico fue rechazado
    if (quoteStatus === 'partial_reject' && itemId && itemType) {
      return isItemRejected(itemId, itemType) 
        ? 'bg-marchant-red-light border-marchant-red' 
        : 'bg-marchant-green-light border-marchant-green';
    }
    
    if (quoteStatus === 'approved') return 'bg-marchant-green-light border-marchant-green';
    if (quoteStatus === 'rejected') return 'bg-marchant-red-light border-marchant-red';
    return 'bg-yellow-50 border-yellow-200';
  };

  const getItemTextColor = (isNew: boolean, itemId?: string, itemType?: 'service' | 'part') => {
    if (!isNew) return 'text-slate-700';
    
    // Si es aprobación parcial, verificar si este item específico fue rechazado
    if (quoteStatus === 'partial_reject' && itemId && itemType) {
      return isItemRejected(itemId, itemType) 
        ? 'text-marchant-red-dark' 
        : 'text-marchant-green-dark';
    }
    
    if (quoteStatus === 'approved') return 'text-marchant-green-dark';
    if (quoteStatus === 'rejected') return 'text-marchant-red-dark';
    return 'text-yellow-700';
  };

  const handleSendQuote = () => {
    dispatch({ type: 'SEND_QUOTE', payload: { workOrderId: workOrder.id } });
  };

  const handleQuoteResponse = (response: 'approved' | 'rejected' | 'partial_reject') => {
    if (response === 'partial_reject') {
      // Inicializar items seleccionados con cantidades completas por defecto
      const defaultServices = newServices.map(service => ({
        id: service.id,
        approvedQuantity: service.quantity
      }));
      const defaultParts = newParts.map(part => ({
        id: part.id,
        approvedQuantity: part.quantity
      }));
      
      setSelectedApprovedItems({
        services: defaultServices,
        parts: defaultParts
      });
      setShowPartialApprovalModal(true);
      return;
    }
    
    dispatch({ 
      type: 'RESPOND_TO_QUOTE', 
      payload: { 
        workOrderId: workOrder.id, 
        response,
        notes: responseNotes
      }
    });
    setResponseNotes('');
    onOpenChange(false);
  };

  const handlePartialApproval = () => {
    dispatch({ 
      type: 'RESPOND_TO_QUOTE', 
      payload: { 
        workOrderId: workOrder.id, 
        response: 'partial_reject',
        approvedItems: selectedApprovedItems,
        notes: responseNotes
      }
    });
    setResponseNotes('');
    setSelectedApprovedItems({ services: [], parts: [] });
    setShowPartialApprovalModal(false);
    onOpenChange(false);
  };

  const ServiceItemDisplay = ({ service, isNew }: { service: WorkOrderService; isNew: boolean }) => {
    const isRejected = isNew && isItemRejected(service.id, 'service');
    const approvedQuantity = getApprovedQuantity(service.id, 'service', service.quantity);
    const displayQuantity = quoteStatus === 'partial_reject' && workOrder.quote?.approvedItems ? approvedQuantity : service.quantity;
    const unitPrice = service.price / service.quantity;
    const displayTotal = unitPrice * displayQuantity;
    
    return (
      <div className={`p-3 rounded-lg border-l-4 ${getItemBackgroundColor(isNew, service.id, 'service')} mb-2`}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className={`text-sm font-medium ${getItemTextColor(isNew, service.id, 'service')}`}>
                {service.service.name}
              </p>
              {isRejected && (
                <Badge variant="destructive" className="text-xs bg-marchant-red text-white">
                  RECHAZADO
                </Badge>
              )}
            </div>
            <p className={`text-xs text-muted-foreground`}>
              Agregado: {service.createdAt.toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-sm ${getItemTextColor(isNew, service.id, 'service')} ${isRejected ? 'line-through' : ''}`}>
              {displayQuantity} x ${unitPrice.toLocaleString()}
            </p>
            <p className={`text-xs ${isRejected ? 'text-marchant-red line-through' : 'text-muted-foreground'}`}>
              Total: ${displayTotal.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const PartItemDisplay = ({ part, isNew }: { part: WorkOrderPart; isNew: boolean }) => {
    const isRejected = isNew && isItemRejected(part.id, 'part');
    const approvedQuantity = getApprovedQuantity(part.id, 'part', part.quantity);
    const displayQuantity = quoteStatus === 'partial_reject' && workOrder.quote?.approvedItems ? approvedQuantity : part.quantity;
    const unitPrice = part.price / part.quantity;
    const displayTotal = unitPrice * displayQuantity;
    
    return (
      <div className={`p-3 rounded-lg border-l-4 ${getItemBackgroundColor(isNew, part.id, 'part')} mb-2`}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className={`text-sm font-medium ${getItemTextColor(isNew, part.id, 'part')}`}>
                {part.part.name}
              </p>
              {isRejected && (
                <Badge variant="destructive" className="text-xs bg-marchant-red text-white">
                  RECHAZADO
                </Badge>
              )}
            </div>
            <p className={`text-xs text-muted-foreground`}>
              Agregado: {part.createdAt.toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-sm ${getItemTextColor(isNew, part.id, 'part')} ${isRejected ? 'line-through' : ''}`}>
              {displayQuantity} x ${unitPrice.toLocaleString()}
            </p>
            <p className={`text-xs ${isRejected ? 'text-marchant-red line-through' : 'text-muted-foreground'}`}>
              Total: ${displayTotal.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-marchant-green">Ficha #{workOrder.id.slice(-6)} - Detalle de Cotización</DialogTitle>
              <DialogDescription>{workOrder.client.name} - {workOrder.bicycle.brand} {workOrder.bicycle.model}</DialogDescription>
            </div>
            <Badge variant={ quoteStatus === 'rejected' ? 'destructive' : 'default' } className={
                quoteStatus === 'approved' ? 'bg-marchant-green text-white' :
                quoteStatus === 'rejected' ? 'bg-marchant-red text-white' :
                quoteStatus === 'partial_reject' ? 'bg-orange-500 text-white' :
                'bg-yellow-400 text-yellow-900'
            }>
                {quoteStatus === 'pending' && 'Cotización Pendiente'}
                {quoteStatus === 'sent' && 'Cotización Enviada'}
                {quoteStatus === 'approved' && 'Aprobada'}
                {quoteStatus === 'rejected' && 'Rechazada'}
                {quoteStatus === 'partial_reject' && 'Aprobación Parcial'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-slate-700">Trabajo Original Acordado</h4>
              <Badge variant="outline" className="bg-slate-50">${originalAmount.toLocaleString()}</Badge>
            </div>
            {(originalServices.length > 0 || originalParts.length > 0) ? (
                <div className="space-y-2">
                    {originalServices.map(service => (<ServiceItemDisplay key={service.id} service={service} isNew={false} />))}
                    {originalParts.map(part => (<PartItemDisplay key={part.id} part={part} isNew={false} />))}
                </div>
            ) : <p className="text-xs text-muted-foreground">Sin items originales.</p>}
          </div>

          {(newServices.length > 0 || newParts.length > 0) && (
            <>
              <Separator />
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className={getItemTextColor(true)}>Trabajo Adicional Requerido</h4>
                  <Badge variant="outline" className={`${getItemBackgroundColor(true)} ${getItemTextColor(true)}`}>+${additionalAmount.toLocaleString()}</Badge>
                </div>
                <div className="space-y-2">
                  {newServices.map(service => (<ServiceItemDisplay key={service.id} service={service} isNew={true} />))}
                  {newParts.map(part => (<PartItemDisplay key={part.id} part={part} isNew={true} />))}
                </div>
              </div>
            </>
          )}

          {workOrder.mechanicNotes && (
            <>
              <Separator />
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-blue-800 font-medium mb-2">Notas del Mecánico</h4>
                <p className="text-sm text-blue-700 whitespace-pre-wrap">{workOrder.mechanicNotes}</p>
              </div>
            </>
          )}

          <div className="p-4 bg-gray-100 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de la Orden</p>
                <div className="text-xs text-muted-foreground">
                  <p>Original: ${originalAmount.toLocaleString()}</p>
                  <p>Adicional: ${additionalAmount.toLocaleString()}</p>
                  {rejectedAmount > 0 && (
                    <p className="text-marchant-red">Rechazado: -${rejectedAmount.toLocaleString()}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-marchant-green">${workOrder.totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            {quoteStatus === 'pending' && <Button onClick={handleSendQuote} className="bg-marchant-green hover:bg-marchant-green-dark"><Send className="h-4 w-4 mr-2" />Enviar Cotización</Button>}
            
            {quoteStatus === 'sent' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100">
                    <Search className="h-4 w-4 mr-2" />
                    Estado de la Cotización
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleQuoteResponse('approved')} className="text-green-700 focus:text-green-800 focus:bg-green-50">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Aprobar Cotización
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleQuoteResponse('partial_reject')} className="text-orange-700 focus:text-orange-800 focus:bg-orange-50">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Aprobación Parcial
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleQuoteResponse('rejected')} className="text-red-700 focus:text-red-800 focus:bg-red-50">
                    <XCircle className="h-4 w-4 mr-2" />
                    Rechazar Cotización
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </DialogContent>
      
      {/* Modal de Aprobación Parcial */}
      <Dialog open={showPartialApprovalModal} onOpenChange={setShowPartialApprovalModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-green-600">Seleccionar Trabajos Aprobados</DialogTitle>
            <DialogDescription>Selecciona qué servicios y piezas aprueba el cliente y en qué cantidad</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {newServices.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Servicios Adicionales</h4>
                <div className="space-y-3">
                  {newServices.map(service => {
                    const approvedItem = selectedApprovedItems.services.find(s => s.id === service.id);
                    const approvedQuantity = approvedItem?.approvedQuantity || 0;
                    const unitPrice = service.price / service.quantity;
                    
                    return (
                      <div key={service.id} className="p-4 border rounded-lg bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <input
                                type="checkbox"
                                id={`service-${service.id}`}
                                checked={approvedQuantity > 0}
                                onChange={(e) => {
                                  const isChecked = e.target.checked;
                                  setSelectedApprovedItems(prev => ({
                                    ...prev,
                                    services: prev.services.map(s => 
                                      s.id === service.id 
                                        ? { ...s, approvedQuantity: isChecked ? service.quantity : 0 }
                                        : s
                                    )
                                  }));
                                }}
                                className="h-4 w-4"
                              />
                              <label htmlFor={`service-${service.id}`} className="text-sm font-medium cursor-pointer">
                                {service.service.name}
                              </label>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                              Precio unitario: ${unitPrice.toLocaleString()}
                            </p>
                            
                            {approvedQuantity > 0 && (
                              <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-600">Cantidad aprobada:</label>
                                <input
                                  type="number"
                                  min="0"
                                  max={service.quantity}
                                  value={approvedQuantity}
                                  onChange={(e) => {
                                    const newQty = Math.min(service.quantity, Math.max(0, parseInt(e.target.value) || 0));
                                    setSelectedApprovedItems(prev => ({
                                      ...prev,
                                      services: prev.services.map(s => 
                                        s.id === service.id 
                                          ? { ...s, approvedQuantity: newQty }
                                          : s
                                      )
                                    }));
                                  }}
                                  className="w-16 px-2 py-1 text-sm border rounded"
                                />
                                <span className="text-sm text-gray-500">de {service.quantity}</span>
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              ${(unitPrice * approvedQuantity).toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Total original: ${service.price.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {newParts.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Piezas Adicionales</h4>
                <div className="space-y-3">
                  {newParts.map(part => {
                    const approvedItem = selectedApprovedItems.parts.find(p => p.id === part.id);
                    const approvedQuantity = approvedItem?.approvedQuantity || 0;
                    const unitPrice = part.price / part.quantity;
                    
                    return (
                      <div key={part.id} className="p-4 border rounded-lg bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <input
                                type="checkbox"
                                id={`part-${part.id}`}
                                checked={approvedQuantity > 0}
                                onChange={(e) => {
                                  const isChecked = e.target.checked;
                                  setSelectedApprovedItems(prev => ({
                                    ...prev,
                                    parts: prev.parts.map(p => 
                                      p.id === part.id 
                                        ? { ...p, approvedQuantity: isChecked ? part.quantity : 0 }
                                        : p
                                    )
                                  }));
                                }}
                                className="h-4 w-4"
                              />
                              <label htmlFor={`part-${part.id}`} className="text-sm font-medium cursor-pointer">
                                {part.part.name}
                              </label>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                              Precio unitario: ${unitPrice.toLocaleString()}
                            </p>
                            
                            {approvedQuantity > 0 && (
                              <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-600">Cantidad aprobada:</label>
                                <input
                                  type="number"
                                  min="0"
                                  max={part.quantity}
                                  value={approvedQuantity}
                                  onChange={(e) => {
                                    const newQty = Math.min(part.quantity, Math.max(0, parseInt(e.target.value) || 0));
                                    setSelectedApprovedItems(prev => ({
                                      ...prev,
                                      parts: prev.parts.map(p => 
                                        p.id === part.id 
                                          ? { ...p, approvedQuantity: newQty }
                                          : p
                                      )
                                    }));
                                  }}
                                  className="w-16 px-2 py-1 text-sm border rounded"
                                />
                                <span className="text-sm text-gray-500">de {part.quantity}</span>
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              ${(unitPrice * approvedQuantity).toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Total original: ${part.price.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowPartialApprovalModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handlePartialApproval} className="bg-green-600 hover:bg-green-700">
                Confirmar Aprobación Parcial
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}