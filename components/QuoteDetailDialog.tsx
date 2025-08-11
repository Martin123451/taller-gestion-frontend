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
  const [showPartialRejectModal, setShowPartialRejectModal] = React.useState(false);
  const [selectedRejectedItems, setSelectedRejectedItems] = React.useState<{
    services: string[];
    parts: string[];
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
  
  // Calcular el monto rechazado si hay rechazo parcial
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

  const isItemRejected = (itemId: string, itemType: 'service' | 'part') => {
    if (!workOrder.quote?.rejectedItems) return false;
    const rejectedIds = itemType === 'service' 
      ? workOrder.quote.rejectedItems.services || []
      : workOrder.quote.rejectedItems.parts || [];
    return rejectedIds.includes(itemId);
  };

  const getItemBackgroundColor = (isNew: boolean, itemId?: string, itemType?: 'service' | 'part') => {
    if (!isNew) return 'bg-slate-50 border-slate-200';
    
    // Si es rechazo parcial, verificar si este item específico fue rechazado
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
    
    // Si es rechazo parcial, verificar si este item específico fue rechazado
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
      setShowPartialRejectModal(true);
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

  const handlePartialReject = () => {
    dispatch({ 
      type: 'RESPOND_TO_QUOTE', 
      payload: { 
        workOrderId: workOrder.id, 
        response: 'partial_reject',
        rejectedItems: selectedRejectedItems,
        notes: responseNotes
      }
    });
    setResponseNotes('');
    setSelectedRejectedItems({ services: [], parts: [] });
    setShowPartialRejectModal(false);
    onOpenChange(false);
  };

  const ServiceItemDisplay = ({ service, isNew }: { service: WorkOrderService; isNew: boolean }) => {
    const isRejected = isNew && isItemRejected(service.id, 'service');
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
              {service.quantity} x ${ (service.price / service.quantity).toLocaleString() }
            </p>
            <p className={`text-xs ${isRejected ? 'text-marchant-red line-through' : 'text-muted-foreground'}`}>
              Total: ${service.price.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const PartItemDisplay = ({ part, isNew }: { part: WorkOrderPart; isNew: boolean }) => {
    const isRejected = isNew && isItemRejected(part.id, 'part');
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
              {part.quantity} x ${ (part.price / part.quantity).toLocaleString() }
            </p>
            <p className={`text-xs ${isRejected ? 'text-marchant-red line-through' : 'text-muted-foreground'}`}>
              Total: ${part.price.toLocaleString()}
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
                {quoteStatus === 'partial_reject' && 'Rechazo Parcial'}
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
                    Rechazo Parcial
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
      
      {/* Modal de Rechazo Parcial */}
      <Dialog open={showPartialRejectModal} onOpenChange={setShowPartialRejectModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-orange-600">Seleccionar Trabajos Rechazados</DialogTitle>
            <DialogDescription>Marca los servicios y piezas que el cliente rechazó</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {newServices.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Servicios Adicionales</h4>
                <div className="space-y-2">
                  {newServices.map(service => (
                    <div key={service.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <input
                        type="checkbox"
                        id={`service-${service.id}`}
                        checked={selectedRejectedItems.services.includes(service.id)}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setSelectedRejectedItems(prev => ({
                            ...prev,
                            services: isChecked 
                              ? [...prev.services, service.id]
                              : prev.services.filter(id => id !== service.id)
                          }));
                        }}
                        className="h-4 w-4"
                      />
                      <label htmlFor={`service-${service.id}`} className="flex-1 cursor-pointer">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">{service.service.name}</span>
                          <span className="text-sm text-muted-foreground">${service.price.toLocaleString()}</span>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {newParts.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Piezas Adicionales</h4>
                <div className="space-y-2">
                  {newParts.map(part => (
                    <div key={part.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <input
                        type="checkbox"
                        id={`part-${part.id}`}
                        checked={selectedRejectedItems.parts.includes(part.id)}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setSelectedRejectedItems(prev => ({
                            ...prev,
                            parts: isChecked 
                              ? [...prev.parts, part.id]
                              : prev.parts.filter(id => id !== part.id)
                          }));
                        }}
                        className="h-4 w-4"
                      />
                      <label htmlFor={`part-${part.id}`} className="flex-1 cursor-pointer">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">{part.part.name}</span>
                          <span className="text-sm text-muted-foreground">${part.price.toLocaleString()}</span>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowPartialRejectModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handlePartialReject} className="bg-orange-600 hover:bg-orange-700">
                Confirmar Rechazo Parcial
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}