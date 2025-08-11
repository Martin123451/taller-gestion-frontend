import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Play, Square, CheckCircle2 } from 'lucide-react';
import { useApp } from './../contexts/AppContext';
import { WorkOrder, WorkOrderStatus } from './../lib/types';
import { WorkOrderCard } from './WorkOrderCard';

const columns = [
  { status: 'open' as WorkOrderStatus, title: 'Abiertas', icon: Square, bgColor: 'bg-slate-50 border-slate-200', headerColor: 'text-slate-600' },
  { status: 'in_progress' as WorkOrderStatus, title: 'En Progreso', icon: Play, bgColor: 'bg-red-50 border-red-200', headerColor: 'text-marchant-red' },
  { status: 'ready_for_delivery' as WorkOrderStatus, title: 'Lista para Entrega', icon: CheckCircle2, bgColor: 'bg-green-50 border-green-200', headerColor: 'text-marchant-green' }
];

export default function KanbanBoard() {
  const { state } = useApp();
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  
  // Filtramos las fichas que no están completadas
  const workOrders = state.workOrders.filter(wo => wo.status !== 'completed');
  
  // Función para obtener las fichas por estado y ordenarlas por fecha estimada de entrega
  const getWorkOrdersByStatus = (status: WorkOrderStatus) => {
    return workOrders
      .filter(wo => wo.status === status)
      .sort((a, b) => {
        // Ordenar por fecha estimada de entrega (más próxima primero)
        const dateA = a.estimatedDeliveryDate ? new Date(a.estimatedDeliveryDate).getTime() : Infinity;
        const dateB = b.estimatedDeliveryDate ? new Date(b.estimatedDeliveryDate).getTime() : Infinity;
        return dateA - dateB;
      });
  };
  
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