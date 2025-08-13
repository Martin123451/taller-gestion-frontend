import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { useApp } from '../../../contexts/AppContext';
import { WorkOrder, WorkOrderStatus } from '../../../lib/types';
import { Users, Bike, FileText, Plus, Truck, AlertTriangle, DollarSign, CheckCircle2, Send } from 'lucide-react';
import WorkOrderDetail from '../../../components/WorkOrderDetail';

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
    const { state, dispatch } = useApp();
    const { clients, bicycles, workOrders } = state;
    const [deliveryModal, setDeliveryModal] = useState<{
        isOpen: boolean;
        workOrder?: WorkOrder;
        remainingAmount?: number;
    }>({ isOpen: false });
    
    const [detailModal, setDetailModal] = useState<{
        isOpen: boolean;
        workOrder?: WorkOrder;
    }>({ isOpen: false });
    
    const [showAllDeliveries, setShowAllDeliveries] = useState(false);

    const openWorkOrdersCount = workOrders.filter(wo => wo.status === 'open').length;
    const inProgressWorkOrders = workOrders.filter(wo => wo.status === 'in_progress');
    const readyForDeliveryCount = workOrders.filter(wo => wo.status === 'ready_for_delivery').length;
    const workOrdersNeedingQuotes = inProgressWorkOrders.filter(wo => {
        // Solo mostrar fichas que realmente necesitan cotización Y tienen items adicionales
        if (!wo.needsQuote || (wo.quote && wo.quote.status !== 'pending')) {
            return false;
        }
        
        // Verificar si tiene items adicionales (no originales)
        const originalServicesCount = wo.originalServices?.length || 0;
        const originalPartsCount = wo.originalParts?.length || 0;
        const currentServicesCount = wo.services?.length || 0;
        const currentPartsCount = wo.parts?.length || 0;
        
        const hasAdditionalItems = (currentServicesCount + currentPartsCount) > (originalServicesCount + originalPartsCount);
        return hasAdditionalItems;
    });

    const handleDeliveryClick = (workOrder: WorkOrder) => {
        const remainingAmount = workOrder.totalAmount - (workOrder.advancePayment || 0);
        setDeliveryModal({
            isOpen: true,
            workOrder,
            remainingAmount
        });
    };

    const confirmDelivery = () => {
        if (deliveryModal.workOrder) {
            dispatch({ type: 'DELIVER_WORK_ORDER', payload: deliveryModal.workOrder.id });
            setDeliveryModal({ isOpen: false });
        }
    };

    const cancelDelivery = () => {
        setDeliveryModal({ isOpen: false });
    };

    const closeDetailModal = () => {
        setDetailModal({ isOpen: false });
    };

    // Filtrar fichas en progreso que requieren gestión de cotizaciones
    const inProgressWorkOrdersForQuotes = inProgressWorkOrders.filter(wo => {
        // Solo mostrar fichas que necesiten cotización
        if (!wo.needsQuote) return false;
        
        // Verificar si tiene items adicionales (no originales)
        const originalServicesCount = wo.originalServices?.length || 0;
        const originalPartsCount = wo.originalParts?.length || 0;
        const currentServicesCount = wo.services?.length || 0;
        const currentPartsCount = wo.parts?.length || 0;
        
        const hasAdditionalItems = (currentServicesCount + currentPartsCount) > (originalServicesCount + originalPartsCount);
        return hasAdditionalItems;
    });

    const handleWorkOrderClick = (workOrder: WorkOrder, event: React.MouseEvent) => {
        // Si es una ficha que necesita cotización, usar el modal de cotización
        if (workOrder.needsQuote && inProgressWorkOrdersForQuotes.some(wo => wo.id === workOrder.id)) {
            onSelectWorkOrderForQuote(workOrder);
        } else {
            // Para todas las demás fichas, mostrar modal de detalle
            event.stopPropagation();
            setDetailModal({
                isOpen: true,
                workOrder
            });
        }
    };

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
                            {(() => {
                                const upcomingWorkOrders = workOrders.filter(wo => ['open', 'in_progress'].includes(wo.status)).sort((a, b) => (a.estimatedDeliveryDate?.getTime() || Infinity) - (b.estimatedDeliveryDate?.getTime() || Infinity));
                                const displayedOrders = showAllDeliveries ? upcomingWorkOrders : upcomingWorkOrders.slice(0, 6);
                                
                                return displayedOrders.map(workOrder => {
                                const remainingAmount = workOrder.totalAmount - (workOrder.advancePayment || 0);
                                
                                return (
                                    <div key={workOrder.id} className="flex items-center justify-between p-3 border rounded cursor-pointer hover:shadow-md transition-shadow" onClick={(e) => handleWorkOrderClick(workOrder, e)}>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium">{workOrder.client.name}</p>
                                            <p className="text-xs text-muted-foreground">{workOrder.bicycle.brand} {workOrder.bicycle.model}</p>
                                            
                                            {/* Resumen financiero */}
                                            <div className="text-xs space-y-0.5 mt-2">
                                                <div className="flex justify-between min-w-[120px]">
                                                    <span>Total:</span>
                                                    <span className="font-medium">${workOrder.totalAmount.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Abono:</span>
                                                    <span className="text-green-600">${(workOrder.advancePayment || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between border-t pt-0.5">
                                                    <span className="font-medium">A Cobrar:</span>
                                                    <span className="font-medium text-marchant-red">${remainingAmount.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant={workOrder.status === 'open' ? 'default' : 'secondary'}>{translateStatus(workOrder.status)}</Badge>
                                            {workOrder.estimatedDeliveryDate && (<p className="text-xs text-muted-foreground mt-1">Entrega: {workOrder.estimatedDeliveryDate.toLocaleDateString()}</p>)}
                                        </div>
                                    </div>
                                )
                            });
                            })()}
                            
                            {(() => {
                                const upcomingWorkOrders = workOrders.filter(wo => ['open', 'in_progress'].includes(wo.status));
                                if (upcomingWorkOrders.length > 6) {
                                    return (
                                        <div className="pt-2 border-t">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="w-full text-marchant-green hover:bg-marchant-green-light"
                                                onClick={() => setShowAllDeliveries(!showAllDeliveries)}
                                            >
                                                {showAllDeliveries 
                                                    ? `Mostrar menos (${upcomingWorkOrders.length - 6} fichas ocultas)` 
                                                    : `Ver todas las fichas (${upcomingWorkOrders.length - 6} más)`
                                                }
                                            </Button>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
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
                            {inProgressWorkOrdersForQuotes.length === 0 ? (<p className="text-sm text-muted-foreground text-center py-4">No hay fichas que requieran cotización</p>) : (
                                inProgressWorkOrdersForQuotes.map(workOrder => {
                                    const remainingAmount = workOrder.totalAmount - (workOrder.advancePayment || 0);
                                    const quoteStatus = workOrder.quote?.status;
                                    
                                    return (
                                        <div key={workOrder.id} className="cursor-pointer border rounded-lg p-3 hover:shadow-md transition-shadow" onClick={() => onSelectWorkOrderForQuote(workOrder)}>
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-1">
                                                    <p className="text-sm text-marchant-green font-medium">{workOrder.client.name}</p>
                                                    <p className="text-xs text-muted-foreground">{workOrder.bicycle.brand} {workOrder.bicycle.model}</p>
                                                    
                                                    {/* Resumen financiero */}
                                                    <div className="text-xs space-y-0.5 mt-2">
                                                        <div className="flex justify-between">
                                                            <span>Total:</span>
                                                            <span className="font-medium">${workOrder.totalAmount.toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Abono:</span>
                                                            <span className="text-green-600">${(workOrder.advancePayment || 0).toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between border-t pt-0.5">
                                                            <span className="font-medium">A Cobrar:</span>
                                                            <span className="font-medium text-marchant-red">${remainingAmount.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    {/* Estado de cotización */}
                                                    {workOrder.needsQuote && (
                                                        <Badge 
                                                            variant="outline"
                                                            className={
                                                                quoteStatus === 'pending' || !quoteStatus ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                                                                quoteStatus === 'sent' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                                                quoteStatus === 'approved' ? 'bg-green-100 text-green-800 border-green-300' :
                                                                quoteStatus === 'rejected' ? 'bg-red-100 text-red-800 border-red-300' :
                                                                quoteStatus === 'partial_reject' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                                                                'bg-yellow-100 text-yellow-800 border-yellow-300'
                                                            }
                                                        >
                                                            {quoteStatus === 'pending' ? 'Cotización Pendiente' :
                                                             quoteStatus === 'sent' ? 'Cotización Enviada' :
                                                             quoteStatus === 'approved' ? 'Cotización Aprobada' :
                                                             quoteStatus === 'rejected' ? 'Cotización Rechazada' :
                                                             quoteStatus === 'partial_reject' ? 'Parcialmente Aprobada' :
                                                             'Necesita Cotización'}
                                                        </Badge>
                                                    )}
                                                    {!workOrder.needsQuote && (
                                                        <Badge variant="default" className="bg-green-600">
                                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                                            Sin Cotización
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Para Entrega</CardTitle><CardDescription>Bicicletas listas para clientes</CardDescription></CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {workOrders.filter(wo => wo.status === 'ready_for_delivery').length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No hay fichas listas para entrega</p>
                            ) : (
                                workOrders.filter(wo => wo.status === 'ready_for_delivery').slice(0, 5).map(workOrder => {
                                    const remainingAmount = workOrder.totalAmount - (workOrder.advancePayment || 0);
                                    
                                    return (
                                        <div key={workOrder.id} className="border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow" onClick={(e) => handleWorkOrderClick(workOrder, e)}>
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium text-marchant-green">{workOrder.client.name}</p>
                                                    {workOrder.client.phone && (
                                                        <p className="text-xs text-muted-foreground">📞 {workOrder.client.phone}</p>
                                                    )}
                                                    <p className="text-xs text-muted-foreground">{workOrder.bicycle.brand} {workOrder.bicycle.model}</p>
                                                    
                                                    {/* Fecha de entrega estimada */}
                                                    {workOrder.estimatedDeliveryDate && (
                                                        <p className="text-xs text-blue-600 font-medium">
                                                            📅 Fecha estimada: {workOrder.estimatedDeliveryDate.toLocaleDateString()}
                                                        </p>
                                                    )}
                                                    
                                                    {/* Resumen financiero */}
                                                    <div className="text-xs space-y-0.5 mt-2">
                                                        <div className="flex justify-between">
                                                            <span>Total:</span>
                                                            <span className="font-medium">${workOrder.totalAmount.toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Abono:</span>
                                                            <span className="text-green-600">${(workOrder.advancePayment || 0).toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between border-t pt-0.5">
                                                            <span className="font-medium">A Cobrar:</span>
                                                            <span className="font-medium text-marchant-red">${remainingAmount.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex flex-col items-end gap-2">
                                                    <Button 
                                                        size="sm" 
                                                        className="bg-marchant-green hover:bg-marchant-green/90"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeliveryClick(workOrder);
                                                        }}
                                                    >
                                                        <Truck className="h-3 w-3 mr-1" />
                                                        Entregar
                                                    </Button>
                                                    
                                                    {remainingAmount > 0 && (
                                                        <Badge variant="destructive">
                                                            Pendiente Pago
                                                        </Badge>
                                                    )}
                                                    {remainingAmount === 0 && (
                                                        <Badge variant="default" className="bg-green-600">
                                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                                            Pagado
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Modal de Confirmación de Entrega */}
            <Dialog open={deliveryModal.isOpen} onOpenChange={(open) => !open && cancelDelivery()}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-marchant-green">
                            <Truck className="h-5 w-5" />
                            Confirmar Entrega
                        </DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que quieres entregar la bicicleta?
                        </DialogDescription>
                    </DialogHeader>
                    
                    {deliveryModal.workOrder && (
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-marchant-green">Cliente:</span>
                                    <span>{deliveryModal.workOrder.client.name}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Bicicleta:</span>
                                    <span>{deliveryModal.workOrder.bicycle.brand} {deliveryModal.workOrder.bicycle.model}</span>
                                </div>
                                <div className="border-t pt-2 space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span>Total:</span>
                                        <span className="font-medium">${deliveryModal.workOrder.totalAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>Abono:</span>
                                        <span className="text-green-600">${(deliveryModal.workOrder.advancePayment || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-t pt-1">
                                        <span className="font-bold">A Cobrar:</span>
                                        <span className="font-bold text-marchant-red text-lg">
                                            ${(deliveryModal.remainingAmount || 0).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            {(deliveryModal.remainingAmount || 0) > 0 && (
                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                        <span className="text-sm text-yellow-800">
                                            Hay un saldo pendiente de ${(deliveryModal.remainingAmount || 0).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    
                    <DialogFooter className="flex gap-2">
                        <Button variant="outline" onClick={cancelDelivery}>
                            Cancelar
                        </Button>
                        <Button 
                            onClick={confirmDelivery}
                            className="bg-marchant-green hover:bg-marchant-green/90"
                        >
                            <Truck className="h-4 w-4 mr-2" />
                            Confirmar Entrega
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Detalle de Ficha */}
            <Dialog open={detailModal.isOpen} onOpenChange={(open) => !open && closeDetailModal()}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    {detailModal.workOrder && (
                        <WorkOrderDetail 
                            workOrder={detailModal.workOrder} 
                            onClose={closeDetailModal}
                            readOnly={detailModal.workOrder.status === 'ready_for_delivery'}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};