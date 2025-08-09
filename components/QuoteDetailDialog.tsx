import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { CheckCircle2, XCircle, Send, Clock, DollarSign } from 'lucide-react';
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

  const originalAmount = workOrder.originalAmount || 0;
  const additionalAmount = workOrder.totalAmount - originalAmount;

  const getQuoteStatus = () => workOrder.quote?.status || 'pending';
  const quoteStatus = getQuoteStatus();

  const getItemBackgroundColor = (isNew: boolean) => {
    if (!isNew) return 'bg-slate-50 border-slate-200';
    if (quoteStatus === 'approved') return 'bg-marchant-green-light border-marchant-green';
    if (quoteStatus === 'rejected') return 'bg-marchant-red-light border-marchant-red';
    return 'bg-yellow-50 border-yellow-200';
  };

  const getItemTextColor = (isNew: boolean) => {
    if (!isNew) return 'text-slate-700';
    if (quoteStatus === 'approved') return 'text-marchant-green-dark';
    if (quoteStatus === 'rejected') return 'text-marchant-red-dark';
    return 'text-yellow-700';
  };

  const handleSendQuote = () => {
    dispatch({ type: 'SEND_QUOTE', payload: { workOrderId: workOrder.id } });
  };

  const handleQuoteResponse = (response: 'approved' | 'rejected') => {
    dispatch({ 
      type: 'RESPOND_TO_QUOTE', 
      payload: { 
        workOrderId: workOrder.id, 
        response,
        notes: responseNotes
      }
    });
    setResponseNotes('');
  };

  const ServiceItemDisplay = ({ service, isNew }: { service: WorkOrderService; isNew: boolean }) => (
  <div className={`p-3 rounded-lg border-l-4 ${getItemBackgroundColor(isNew)} mb-2`}>
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <p className={`text-sm font-medium ${getItemTextColor(isNew)}`}>{service.service.name}</p>
        <p className={`text-xs text-muted-foreground`}>
          Agregado: {service.createdAt.toLocaleDateString()}
        </p>
      </div>
      <div className="text-right">
        <p className={`text-sm ${getItemTextColor(isNew)}`}>
          {service.quantity} x ${ (service.price / service.quantity).toLocaleString() }
        </p>
        <p className={`text-xs text-muted-foreground`}>
          Total: ${service.price.toLocaleString()}
        </p>
      </div>
    </div>
  </div>
);

  const PartItemDisplay = ({ part, isNew }: { part: WorkOrderPart; isNew: boolean }) => (
  <div className={`p-3 rounded-lg border-l-4 ${getItemBackgroundColor(isNew)} mb-2`}>
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <p className={`text-sm font-medium ${getItemTextColor(isNew)}`}>{part.part.name}</p>
        <p className={`text-xs text-muted-foreground`}>
          Agregado: {part.createdAt.toLocaleDateString()}
        </p>
      </div>
      <div className="text-right">
        <p className={`text-sm ${getItemTextColor(isNew)}`}>
          {part.quantity} x ${ (part.price / part.quantity).toLocaleString() }
        </p>
        <p className={`text-xs text-muted-foreground`}>
          Total: ${part.price.toLocaleString()}
        </p>
      </div>
    </div>
  </div>
);

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
                'bg-yellow-400 text-yellow-900'
            }>
                {quoteStatus === 'pending' && 'Cotización Pendiente'}
                {quoteStatus === 'sent' && 'Cotización Enviada'}
                {quoteStatus === 'approved' && 'Aprobada'}
                {quoteStatus === 'rejected' && 'Rechazada'}
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

          <div className="p-4 bg-gray-100 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de la Orden</p>
                <p className="text-xs text-muted-foreground">(Original: ${originalAmount.toLocaleString()} + Adicional: ${additionalAmount.toLocaleString()})</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-marchant-green">${workOrder.totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4 border-t">
            {quoteStatus === 'pending' && <Button onClick={handleSendQuote} className="bg-marchant-green hover:bg-marchant-green-dark"><Send className="h-4 w-4 mr-2" />Enviar Cotización</Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}