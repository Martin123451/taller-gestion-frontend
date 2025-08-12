import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { useApp } from '../../../contexts/AppContext';
import { Client } from '../../../lib/types';
import { createClient } from '../../../services/clients';

interface NewClientFormProps {
  closeModal: () => void;
  onClientCreated: (newClient: Client) => void;
}

export const NewClientForm = ({ closeModal, onClientCreated }: NewClientFormProps) => {
    const { dispatch } = useApp();
    const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', address: '' });

    const handleAddClient = async () => {
        const clientData = { ...newClient, createdAt: new Date(), updatedAt: new Date() };
        const createdClient = await createClient(clientData);
        dispatch({ type: 'ADD_CLIENT', payload: createdClient });
        onClientCreated(createdClient);
        closeModal();
    };

    return (
        <>
            <DialogHeader>
                <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
                <DialogDescription>Completa la información del cliente</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
                <div><Label htmlFor="name">Nombre Completo</Label><Input id="name" value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} placeholder="Juan Pérez" /></div>
                <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} placeholder="juan@email.com" /></div>
                <div><Label htmlFor="phone">Teléfono</Label><Input id="phone" value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} placeholder="+56912345678" /></div>
                <div><Label htmlFor="address">Dirección</Label><Textarea id="address" value={newClient.address || ''} onChange={(e) => setNewClient({ ...newClient, address: e.target.value })} placeholder="Dirección completa" /></div>
                <Button onClick={handleAddClient} className="w-full">Guardar Cliente</Button>
            </div>
        </>
    );
};