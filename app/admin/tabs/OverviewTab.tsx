import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { useApp } from '../../../contexts/AppContext';
import { WorkOrder, WorkOrderStatus } from '../../../lib/types';
import { Users, Bike, FileText, Plus, Truck, AlertTriangle, DollarSign, CheckCircle2, Send } from 'lucide-react';

const translateStatus = (status: WorkOrderStatus): string => {
    const statusMap: Record<WorkOrderStatus, string> = {
        open: 'Abierta',
        in_progress: 'En Progreso',
        ready_for_delivery: 'Lista para Entrega',
        completed: 'Finalizada',
    };
    return statusMap[status] || status;
};

interface OverviewTabProps {
    onNewWorkOrderClick: () => void;
    onSelectWorkOrderForQuote: (workOrder: WorkOrder) => void;
    setActiveTab: (tab: string) => void;
}

export const OverviewTab = ({ onNewWorkOrderClick, onSelectWorkOrderForQuote, setActiveTab }: OverviewTabProps) => {
    const { state } = useApp();
    const { clients, bicycles, workOrders } = state;

    const openWorkOrdersCount = workOrders.filter(wo => wo.status === 'open').length;
    const inProgressWorkOrders = workOrders.filter(wo => wo.status === 'in_progress');
    const readyForDeliveryCount = workOrders.filter(wo => wo.status === 'ready_for_delivery').length;
    const workOrdersNeedingQuotes = inProgressWorkOrders.filter(wo => wo.needsQuote && !wo.quote);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm">Clientes</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl">{clients.length}</div><p className="text-xs text-muted-foreground">Total registrados</p></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm">Bicicletas</CardTitle><Bike className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl">{bicycles.length}</div><p className="text-xs text-muted-foreground">En el sistema</p></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm">Fichas Abiertas</CardTitle><FileText className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl">{openWorkOrdersCount}</div><p className="text-xs text-muted-foreground">Pendientes</p></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm">Para Entrega</CardTitle><Truck className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl">{readyForDeliveryCount}</div><p className="text-xs text-muted-foreground">Listas</p></CardContent></Card>
            </div>

            {workOrdersNeedingQuotes.length > 0 && (
                <Card className="bg-yellow-50 border-yellow-300 text-yellow-800 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('workorders')}>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center">
                            <AlertTriangle className="h-6 w-6 mr-4 text-yellow-500" />
                            <div>
                                <p className="font-bold">Tienes {workOrdersNeedingQuotes.length} cotización(es) pendiente(s)</p>
                                <p className="text-sm">Revísalas en la sección "Fichas en Progreso".</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div><CardTitle>Próximas Entregas</CardTitle><CardDescription>Fichas por fecha de entrega</CardDescription></div>
                        <Button size="sm" onClick={onNewWorkOrderClick}><Plus className="h-4 w-4 mr-2" />Nueva Ficha</Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {workOrders.filter(wo => ['open', 'in_progress'].includes(wo.status)).sort((a, b) => (a.estimatedDeliveryDate?.getTime() || Infinity) - (b.estimatedDeliveryDate?.getTime() || Infinity)).slice(0, 5).map(workOrder => (
                                <div key={workOrder.id} className="flex items-center justify-between p-3 border rounded">
                                    <div className="space-y-1">
                                        <p className="text-sm">{workOrder.client.name}</p>
                                        <p className="text-xs text-muted-foreground">{workOrder.bicycle.brand} {workOrder.bicycle.model}</p>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant={workOrder.status === 'open' ? 'default' : 'secondary'}>{translateStatus(workOrder.status)}</Badge>
                                        {workOrder.estimatedDeliveryDate && (<p className="text-xs text-muted-foreground mt-1">Entrega: {workOrder.estimatedDeliveryDate.toLocaleDateString()}</p>)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-marchant-green" />Fichas en Progreso</CardTitle>
                        <CardDescription>Gestión de cotizaciones</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {inProgressWorkOrders.length === 0 ? (<p className="text-sm text-muted-foreground text-center py-4">No hay fichas en progreso</p>) : (
                                inProgressWorkOrders.map(workOrder => (
                                    <div key={workOrder.id} className="cursor-pointer border rounded-lg p-3 hover:shadow-md transition-shadow" onClick={() => onSelectWorkOrderForQuote(workOrder)}>
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <p className="text-sm text-marchant-green">{workOrder.client.name}</p>
                                                <p className="text-xs text-muted-foreground">{workOrder.bicycle.brand} {workOrder.bicycle.model}</p>
                                            </div>
                                            {/* Badges for quote status can be added here */}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Para Entrega</CardTitle><CardDescription>Bicicletas listas para clientes</CardDescription></CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {workOrders.filter(wo => wo.status === 'ready_for_delivery').slice(0, 5).map(workOrder => (
                                <div key={workOrder.id} className="flex items-center justify-between p-3 border rounded">
                                    <div>
                                        <p className="text-sm">{workOrder.client.name}</p>
                                        <p className="text-xs text-muted-foreground">{workOrder.bicycle.brand} {workOrder.bicycle.model}</p>
                                    </div>
                                    <p className="text-xs text-marchant-red font-medium">A cobrar: ${(workOrder.totalAmount - (workOrder.advancePayment || 0)).toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};