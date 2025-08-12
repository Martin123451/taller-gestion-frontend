import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Dialog, DialogContent } from '../../components/ui/dialog';
import { useApp } from '../../contexts/AppContext';
import { WorkOrder } from '../../lib/types';
import { getServices } from '../../services/services';
import { getParts } from '../../services/parts';

// Import newly created components
import { OverviewTab } from './tabs/OverviewTab';
import { ClientsTab } from './tabs/ClientsTab';
import { BicyclesTab } from './tabs/BicyclesTab';
import { WorkOrdersTab } from './tabs/WorkOrdersTab';
import { DataTab } from './tabs/DataTab';
import { NewWorkOrderForm } from './forms/NewWorkOrderForm';
import { NewClientForm } from './forms/NewClientForm';
import { NewBicycleForm } from './forms/NewBicycleForm';

import InventoryManagement from './InventoryManagement';
import UserManagement from './UserManagement';
import QuoteDetailDialog from '../../components/QuoteDetailDialog';

export default function AdminDashboard() {
    const { dispatch } = useApp();
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedWorkOrderForQuote, setSelectedWorkOrderForQuote] = useState<WorkOrder | null>(null);

    const [newWorkOrder, setNewWorkOrder] = useState({ clientId: '', bicycleId: '', description: '', estimatedDeliveryDate: '' });
    const [showAddWorkOrderModal, setShowAddWorkOrderModal] = useState(false);
    const [showAddClientModal, setShowAddClientModal] = useState(false);
    const [showAddBicycleModal, setShowAddBicycleModal] = useState(false);

    /**
     * Fetch essential initial data for the forms, such as services and parts.
     */
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const servicesData = await getServices();
                const partsData = await getParts();
                dispatch({ type: 'SET_SERVICES', payload: servicesData });
                dispatch({ type: 'SET_PARTS', payload: partsData });
            } catch (error) {
                console.error("Error fetching initial data:", error);
            }
        };

        fetchInitialData();
    }, [dispatch]);

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1>Panel de Administración</h1>
                <p className="text-muted-foreground">Sistema de gestión del taller Marchant Bike</p>
            </div>

            <Tabs defaultValue="overview" onValueChange={setActiveTab} value={activeTab} className="w-full">
                <TabsList className="grid w-full grid-cols-7">
                    <TabsTrigger value="overview">Resumen</TabsTrigger>
                    <TabsTrigger value="clients">Clientes</TabsTrigger>
                    <TabsTrigger value="bicycles">Bicicletas</TabsTrigger>
                    <TabsTrigger value="workorders">Fichas</TabsTrigger>
                    <TabsTrigger value="inventory">Inventario</TabsTrigger>
                    <TabsTrigger value="data">Datos</TabsTrigger>
                    <TabsTrigger value="users">Usuarios</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="mt-6">
                    <OverviewTab
                        onNewWorkOrderClick={() => setShowAddWorkOrderModal(true)}
                        onSelectWorkOrderForQuote={setSelectedWorkOrderForQuote}
                        setActiveTab={setActiveTab}
                    />
                </TabsContent>
                <TabsContent value="clients" className="mt-6"><ClientsTab onNewClientClick={() => setShowAddClientModal(true)} /></TabsContent>
                <TabsContent value="bicycles" className="mt-6"><BicyclesTab onNewBicycleClick={() => setShowAddBicycleModal(true)} /></TabsContent>
                <TabsContent value="workorders" className="mt-6"><WorkOrdersTab onNewWorkOrderClick={() => setShowAddWorkOrderModal(true)} /></TabsContent>
                <TabsContent value="inventory" className="mt-6"><InventoryManagement activeTab={activeTab} /></TabsContent>
                <TabsContent value="data" className="mt-6"><DataTab /></TabsContent>
                <TabsContent value="users" className="mt-6"><UserManagement /></TabsContent>
            </Tabs>

            {/* Modal Management */}
            <Dialog open={showAddWorkOrderModal} onOpenChange={setShowAddWorkOrderModal}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <NewWorkOrderForm
                        closeModal={() => setShowAddWorkOrderModal(false)}
                        newWorkOrder={newWorkOrder}
                        setNewWorkOrder={setNewWorkOrder}
                        onShowAddClient={() => setShowAddClientModal(true)}
                        onShowAddBicycle={() => setShowAddBicycleModal(true)}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={showAddClientModal} onOpenChange={setShowAddClientModal}>
                <DialogContent>
                    <NewClientForm
                        closeModal={() => setShowAddClientModal(false)}
                        onClientCreated={(client) => setNewWorkOrder(prev => ({ ...prev, clientId: client.id }))}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={showAddBicycleModal} onOpenChange={setShowAddBicycleModal}>
                <DialogContent>
                    <NewBicycleForm
                        closeModal={() => setShowAddBicycleModal(false)}
                        selectedClientId={newWorkOrder.clientId}
                        onBicycleCreated={(bicycle) => setNewWorkOrder(prev => ({ ...prev, bicycleId: bicycle.id }))}
                    />
                </DialogContent>
            </Dialog>

            {selectedWorkOrderForQuote && (
                <QuoteDetailDialog
                    workOrder={selectedWorkOrderForQuote}
                    open={!!selectedWorkOrderForQuote}
                    onOpenChange={(open) => !open && setSelectedWorkOrderForQuote(null)}
                />
            )}
        </div>
    );
}