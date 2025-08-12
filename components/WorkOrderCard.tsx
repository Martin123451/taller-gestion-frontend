import React, { memo } from 'react';
import { WorkOrder, WorkOrderStatus } from './../lib/types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';
import WorkOrderDetail from './WorkOrderDetail';

interface WorkOrderCardProps {
  workOrder: WorkOrder;
  isSelected: boolean;
  onSelect: (workOrder: WorkOrder | null) => void;
}

const WorkOrderCardComponent = ({ workOrder, isSelected, onSelect }: WorkOrderCardProps) => {

  const translateStatus = (status: WorkOrderStatus) => {
    switch (status) {
      case 'open': return 'Abierta';
      case 'in_progress': return 'En Progreso';
      case 'ready_for_delivery': return 'Lista';
      default: return 'Finalizada';
    }
  };

  const getStatusBadgeVariant = (status: WorkOrderStatus) => {
    switch(status) {
      case 'open': return { variant: 'default', className: 'bg-slate-500' };
      case 'in_progress': return { variant: 'secondary', className: 'bg-marchant-red text-white' };
      case 'ready_for_delivery': return { variant: 'outline', className: 'bg-marchant-green text-white' };
      default: return { variant: 'outline', className: 'bg-marchant-green text-white' };
    }
  };

  const statusBadge = getStatusBadgeVariant(workOrder.status);
  const mechanicName = workOrder.mechanic?.name;

  return (
    <Dialog open={isSelected} onOpenChange={(isOpen) => onSelect(isOpen ? workOrder : null)}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 mb-3 border-l-4 border-l-marchant-green">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-sm text-marchant-green">{workOrder.client?.name || 'Cliente no encontrado'}</CardTitle>
                <p className="text-xs text-muted-foreground">{workOrder.bicycle?.brand} {workOrder.bicycle?.model}</p>
                {(workOrder.status === 'in_progress' || workOrder.status === 'ready_for_delivery') && mechanicName && (
                  <p className="text-xs text-marchant-red font-medium">🔧 {mechanicName}</p>
                )}
              </div>
              <Badge variant={statusBadge.variant as any} className={statusBadge.className}>
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
              <div className="text-right">
                <p className="text-sm font-semibold text-marchant-green">
                  ${workOrder.totalAmount.toLocaleString()}
                </p>
                {workOrder.advancePayment > 0 && (
                  <div className="text-xs space-y-0.5">
                    <div className="text-green-600">Abono: ${workOrder.advancePayment.toLocaleString()}</div>
                    <div className="text-marchant-red font-medium">
                      A cobrar: ${(workOrder.totalAmount - workOrder.advancePayment).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
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
};

export const WorkOrderCard = memo(WorkOrderCardComponent);