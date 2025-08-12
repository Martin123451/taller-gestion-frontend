import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import { useApp } from '../../../contexts/AppContext';
import { Bicycle } from '../../../lib/types';
import { createBicycle } from '../../../services/bicycles';

interface NewBicycleFormProps {
    closeModal: () => void;
    selectedClientId: string;
    onBicycleCreated: (newBicycle: Bicycle) => void;
}

export const NewBicycleForm = ({ closeModal, selectedClientId, onBicycleCreated }: NewBicycleFormProps) => {
    const { state, dispatch } = useApp();
    const [newBicycle, setNewBicycle] = useState({ clientId: selectedClientId || '', brand: '', model: '', type: 'mountain' as const, color: '', serialNumber: '', year: new Date().getFullYear(), notes: '' });

    const handleAddBicycle = async () => {
        const bicycleData = { ...newBicycle, createdAt: new Date(), updatedAt: new Date() };
        const createdBicycle = await createBicycle(bicycleData);
        dispatch({ type: 'ADD_BICYCLE', payload: createdBicycle });
        onBicycleCreated(createdBicycle);
        closeModal();
    };

    return (
        <>
            <DialogHeader><DialogTitle>Agregar Nueva Bicicleta</DialogTitle><DialogDescription>Registra una nueva bicicleta en el sistema</DialogDescription></DialogHeader>
            <div className="space-y-4 pt-4">
                <div><Label htmlFor="clientId">Cliente</Label><Select value={newBicycle.clientId} onValueChange={(value) => setNewBicycle({ ...newBicycle, clientId: value })}><SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger><SelectContent>{state.clients.map(client => (<SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>))}</SelectContent></Select></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><Label htmlFor="brand">Marca</Label><Input id="brand" value={newBicycle.brand} onChange={(e) => setNewBicycle({ ...newBicycle, brand: e.target.value })} placeholder="Trek, Giant, etc." /></div>
                    <div><Label htmlFor="model">Modelo</Label><Input id="model" value={newBicycle.model} onChange={(e) => setNewBicycle({ ...newBicycle, model: e.target.value })} placeholder="Marlin 7, Escape 3, etc." /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div><Label htmlFor="type">Tipo</Label><Select value={newBicycle.type} onValueChange={(value: any) => setNewBicycle({ ...newBicycle, type: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="mountain">Montaña</SelectItem><SelectItem value="road">Ruta</SelectItem><SelectItem value="hybrid">Híbrida</SelectItem><SelectItem value="electric">Eléctrica</SelectItem><SelectItem value="bmx">BMX</SelectItem><SelectItem value="other">Otro</SelectItem></SelectContent></Select></div>
                    <div><Label htmlFor="color">Color</Label><Input id="color" value={newBicycle.color} onChange={(e) => setNewBicycle({ ...newBicycle, color: e.target.value })} placeholder="Azul, Rojo, etc." /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div><Label htmlFor="serialNumber">Número de Serie</Label><Input id="serialNumber" value={newBicycle.serialNumber || ''} onChange={(e) => setNewBicycle({ ...newBicycle, serialNumber: e.target.value })} placeholder="Opcional" /></div>
                    <div><Label htmlFor="year">Año</Label><Input id="year" type="number" value={newBicycle.year} onChange={(e) => setNewBicycle({ ...newBicycle, year: parseInt(e.target.value) })} onWheel={(e) => e.currentTarget.blur()} /></div>
                </div>
                <div><Label htmlFor="notes">Notas</Label><Textarea id="notes" value={newBicycle.notes || ''} onChange={(e) => setNewBicycle({ ...newBicycle, notes: e.target.value })} placeholder="Observaciones adicionales" /></div>
                <Button onClick={handleAddBicycle} className="w-full">Guardar Bicicleta</Button>
            </div>
        </>
    );
};