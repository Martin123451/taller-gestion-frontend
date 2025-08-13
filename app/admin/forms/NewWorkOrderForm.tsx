import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Separator } from '../../../components/ui/separator';
import { Textarea } from '../../../components/ui/textarea';
import { useApp } from '../../../contexts/AppContext';
import { createWorkOrder } from '../../../services/workOrders';
import ClientSearchCombobox from '../../../components/ClientSearchCombobox';
import ServiceSearchCombobox from '../../../components/ServiceSearchCombobox';
import PartSearchCombobox from '../../../components/PartSearchCombobox';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { Client, Bicycle } from '../../../lib/types';

const dateFromInput = (dateString: string): Date => {
    if (!dateString) return new Date();
    return new Date(dateString + 'T12:00:00');
};

interface NewWorkOrderFormProps {
    closeModal: () => void;
    newWorkOrder: any;
    setNewWorkOrder: (data: any) => void;
    onShowAddClient: () => void;
    onShowAddBicycle: () => void;
}

export const NewWorkOrderForm = ({ closeModal, newWorkOrder, setNewWorkOrder, onShowAddClient, onShowAddBicycle }: NewWorkOrderFormProps) => {
    const { state, dispatch } = useApp();
    const [selectedServices, setSelectedServices] = useState<any[]>([]);
    const [selectedParts, setSelectedParts] = useState<any[]>([]);
    const [advancePayment, setAdvancePayment] = useState<string>('');

    React.useEffect(() => {
        if (!newWorkOrder.clientId) {
            setSelectedServices([]);
            setSelectedParts([]);
            setAdvancePayment('');
        }
    }, [newWorkOrder.clientId]);

    const addService = (serviceId: string) => {
        const serviceToAdd = state.services?.find(s => s.id === serviceId);
        if (serviceToAdd && !selectedServices.some(s => s.serviceId === serviceId)) {
            const newService = {
                id: `wos-${Date.now()}`,
                serviceId: serviceToAdd.id,
                service: serviceToAdd,
                quantity: 1,
                price: serviceToAdd.price,
                createdAt: new Date()
            };
            setSelectedServices(prev => [...prev, newService]);
        }
    };
    
    const addPart = (partId: string) => {
        const partToAdd = state.parts?.find(p => p.id === partId);
        if (partToAdd && partToAdd.stock > 0 && !selectedParts.some(p => p.partId === partId)) {
            const newPart = {
                id: `wop-${Date.now()}`,
                partId: partToAdd.id,
                part: partToAdd,
                quantity: 1,
                price: partToAdd.price,
                createdAt: new Date()
            };
            setSelectedParts(prev => [...prev, newPart]);
        }
    };

    const updateServiceQuantity = (serviceId: string, quantity: number) => {
        setSelectedServices(services => services.map(s => 
            s.id === serviceId 
            ? { ...s, quantity, price: (s.service?.price || 0) * quantity } 
            : s
        ));
    };

    /**
     * Updates the quantity of a selected part, ensuring it doesn't exceed available stock.
     */
    const updatePartQuantity = (partId: string, quantity: number) => {
        setSelectedParts(parts => parts.map(p => {
            if (p.id === partId) {
                const stockAvailable = p.part?.stock || 0;
                // Ensure quantity is at least 1 and not more than the available stock
                const newQuantity = Math.max(1, Math.min(quantity, stockAvailable));
                return { ...p, quantity: newQuantity, price: (p.part?.price || 0) * newQuantity };
            }
            return p;
        }));
    };

    const removeService = (serviceId: string) => setSelectedServices(services => services.filter(s => s.id !== serviceId));
    const removePart = (partId: string) => setSelectedParts(parts => parts.filter(p => p.id !== partId));
    const calculateTotal = () => [...selectedServices, ...selectedParts].reduce((sum, item) => sum + (item.price || 0), 0);

    const handleAddWorkOrder = async () => {
        const client = state.clients.find(c => c.id === newWorkOrder.clientId);
        const bicycle = state.bicycles.find(b => b.id === newWorkOrder.bicycleId);
        if (!client || !bicycle) return;

        const totalAmount = calculateTotal();
        const workOrderData = {
            ...newWorkOrder,
            status: 'open' as const,
            services: selectedServices,
            parts: selectedParts,
            totalAmount,
            advancePayment: parseFloat(advancePayment) || 0,
            originalServices: selectedServices,
            originalParts: selectedParts,
            originalAmount: totalAmount,
            needsQuote: false,
            estimatedDeliveryDate: newWorkOrder.estimatedDeliveryDate ? dateFromInput(newWorkOrder.estimatedDeliveryDate) : null,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const createdWorkOrder = await createWorkOrder(workOrderData, client, bicycle);
        dispatch({ type: 'ADD_WORK_ORDER', payload: createdWorkOrder });
        closeModal();
    };

    const availableBicycles = state.bicycles.filter(b => b.clientId === newWorkOrder.clientId);

    return (
        <>
            <DialogHeader><DialogTitle>Crear Nueva Ficha de Trabajo</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
                <div><Label htmlFor="clientId">Cliente</Label><ClientSearchCombobox selectedClientId={newWorkOrder.clientId} onSelectClient={(clientId) => setNewWorkOrder({ ...newWorkOrder, clientId, bicycleId: '' })} onAddNewClient={onShowAddClient} /></div>
                <div className="flex items-end gap-2">
                    <div className="flex-grow"><Label htmlFor="bicycleId">Bicicleta</Label><Select value={newWorkOrder.bicycleId} onValueChange={(value) => setNewWorkOrder({ ...newWorkOrder, bicycleId: value })} disabled={!newWorkOrder.clientId}><SelectTrigger><SelectValue placeholder="Seleccionar bicicleta" /></SelectTrigger><SelectContent>{availableBicycles.map(bicycle => (<SelectItem key={bicycle.id} value={bicycle.id}>{bicycle.brand} {bicycle.model} ({bicycle.color})</SelectItem>))}</SelectContent></Select></div>
                    <Button variant="outline" size="icon" onClick={onShowAddBicycle} disabled={!newWorkOrder.clientId}><Plus className="h-4 w-4" /></Button>
                </div>
                <div><Label htmlFor="description">Descripción del Trabajo</Label><Textarea id="description" value={newWorkOrder.description} onChange={(e) => setNewWorkOrder({ ...newWorkOrder, description: e.target.value })} /></div>
                <div><Label htmlFor="estimatedDeliveryDate">Fecha de Entrega Estimada</Label><Input id="estimatedDeliveryDate" type="date" value={newWorkOrder.estimatedDeliveryDate} onChange={(e) => setNewWorkOrder({ ...newWorkOrder, estimatedDeliveryDate: e.target.value })} /></div>
                
                <Separator />
                
                {/* Sección de Servicios */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="text-marchant-green">Servicios Requeridos</h4>
                        <ServiceSearchCombobox
                            services={state.services || []}
                            selectedServices={selectedServices.map(s => s.serviceId)}
                            onSelectService={addService}
                            placeholder="Buscar y agregar servicio..."
                            className="w-64"
                        />
                    </div>
                    {selectedServices.map(service => (
                        <div key={service.id} className="flex items-center justify-between p-3 border-l-4 border-l-marchant-green rounded mb-2 bg-marchant-green-light">
                            <div className="flex-1">
                                <p className="text-sm">{service.service?.name || 'Servicio no encontrado'}</p>
                                <p className="text-xs text-muted-foreground">${(service.price / service.quantity).toLocaleString()} c/u</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => updateServiceQuantity(service.id, Math.max(1, service.quantity - 1))}><Minus className="h-3 w-3" /></Button>
                                <span className="w-8 text-center text-sm">{service.quantity}</span>
                                <Button variant="outline" size="sm" onClick={() => updateServiceQuantity(service.id, service.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                                <Button variant="destructive" size="sm" onClick={() => removeService(service.id)} className="bg-marchant-red hover:bg-marchant-red-dark"><Trash2 className="h-3 w-3" /></Button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Sección de Piezas */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="text-marchant-green">Piezas Requeridas</h4>
                        <PartSearchCombobox
                            parts={state.parts || []}
                            selectedParts={selectedParts.map(p => p.partId)}
                            onSelectPart={addPart}
                            placeholder="Buscar y agregar pieza..."
                            className="w-64"
                        />
                    </div>
                    {selectedParts.map(part => (
                         <div key={part.id} className="flex items-center justify-between p-3 border-l-4 border-l-marchant-red rounded mb-2 bg-marchant-red-light">
                            <div className="flex-1">
                                <p className="text-sm">{part.part?.name || 'Pieza no encontrada'}</p>
                                <p className="text-xs text-muted-foreground">${(part.price / part.quantity).toLocaleString()} c/u</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => updatePartQuantity(part.id, part.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                                <span className="w-8 text-center text-sm">{part.quantity}</span>
                                <Button variant="outline" size="sm" onClick={() => updatePartQuantity(part.id, part.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                                <Button variant="destructive" size="sm" onClick={() => removePart(part.id)} className="bg-marchant-red hover:bg-marchant-red-dark"><Trash2 className="h-3 w-3" /></Button>
                            </div>
                        </div>
                    ))}
                </div>
                
                {(selectedServices.length > 0 || selectedParts.length > 0) && (
                    <div className="pt-4 bg-gray-50 p-4 -m-6 mt-4 rounded-lg space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Total Estimado:</span>
                            <span className="text-lg font-bold text-marchant-green">${calculateTotal().toLocaleString()}</span>
                        </div>
                        <div>
                            <Label htmlFor="advancePayment">Abono/Adelanto</Label>
                            <Input
                                id="advancePayment"
                                type="number"
                                value={advancePayment}
                                onChange={(e) => setAdvancePayment(e.target.value)}
                                onWheel={(e) => e.currentTarget.blur()}
                                placeholder={`Abonar $${Math.round(calculateTotal() * 0.5).toLocaleString()}`}
                                className="mt-1"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Sugerencia: 50% del total (${Math.round(calculateTotal() * 0.5).toLocaleString()})
                            </p>
                        </div>
                        {advancePayment && parseFloat(advancePayment) > 0 && (
                            <div className="flex justify-between items-center text-sm border-t pt-2">
                                <span className="text-muted-foreground">Restante por cobrar:</span>
                                <span className="font-medium text-marchant-red">${(calculateTotal() - (parseFloat(advancePayment) || 0)).toLocaleString()}</span>
                            </div>
                        )}
                    </div>
                )}

                <Button onClick={handleAddWorkOrder} className="w-full">Crear Ficha</Button>
            </div>
        </>
    );
};