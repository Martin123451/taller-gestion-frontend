import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { ServiceItem, PartItem } from '../../lib/types';
import EditItemDialog from '../../components/EditItemDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../components/ui/alert-dialog';
import { getServices, createService } from '../../services/services';
import { getParts, createPart } from '../../services/parts';

const ItemForm = ({ onSave, itemType }: { onSave: (item: any) => void, itemType: 'service' | 'part' }) => {
    const [formData, setFormData] = useState({ 
        name: '', 
        price: '', 
        ...(itemType === 'service' && { 
            description: '' 
        }),
        ...(itemType === 'part' && { 
            stock: '', 
            brand: '', 
            code: '', 
            costPrice: '', 
            department: '' 
        }) 
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value, type } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [id]: type === 'number' ? (value === '' ? '' : parseFloat(value) || '') : value 
        }));
    };

    return (
        <div className="space-y-4">
        <div>
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" value={formData.name} onChange={handleChange} />
        </div>
        <div>
            <Label htmlFor="price">Precio</Label>
            <Input id="price" type="number" value={formData.price} onChange={handleChange} onWheel={(e) => e.currentTarget.blur()} placeholder="Ej: 15000" />
        </div>
        {itemType === 'service' && (
            <div>
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Textarea id="description" value={(formData as any).description} onChange={handleChange} placeholder="Descripción detallada del servicio..." rows={3} />
            </div>
        )}
        {itemType === 'part' && (
            <>
            <div>
                <Label htmlFor="stock">Stock</Label>
                <Input id="stock" type="number" value={(formData as PartItem).stock} onChange={handleChange} onWheel={(e) => e.currentTarget.blur()} placeholder="Ej: 10" />
            </div>
            <div>
                <Label htmlFor="brand">Marca</Label>
                <Input id="brand" value={(formData as PartItem).brand} onChange={handleChange} placeholder="Ej: Shimano" />
            </div>
            <div>
                <Label htmlFor="code">Código</Label>
                <Input id="code" value={(formData as PartItem).code} onChange={handleChange} placeholder="Ej: SH-001" />
            </div>
            <div>
                <Label htmlFor="costPrice">Precio Costo</Label>
                <Input id="costPrice" type="number" value={(formData as PartItem).costPrice} onChange={handleChange} onWheel={(e) => e.currentTarget.blur()} placeholder="Ej: 8000" />
            </div>
            <div>
                <Label htmlFor="department">Departamento</Label>
                <Input id="department" value={(formData as PartItem).department} onChange={handleChange} placeholder="Ej: Transmisión" />
            </div>
            </>
        )}
        <Button onClick={() => {
            const processedData = {
                ...formData,
                price: formData.price === '' ? 0 : parseFloat(formData.price as string) || 0,
                ...(itemType === 'part' && {
                    stock: (formData as any).stock === '' ? 0 : parseFloat((formData as any).stock) || 0,
                    costPrice: (formData as any).costPrice === '' ? 0 : parseFloat((formData as any).costPrice) || 0
                })
            };
            onSave(processedData);
        }} className="w-full">Guardar</Button>
        </div>
    );
};

export default function InventoryManagement({ activeTab }: { activeTab: string }) {
  const { state, dispatch } = useApp();
  
  useEffect(() => {
    const refreshInventory = async () => {
      console.log("Pestaña de inventario activa, actualizando datos...");
      const servicesFromFirebase = await getServices();
      const partsFromFirebase = await getParts();
      dispatch({ type: 'SET_SERVICES', payload: servicesFromFirebase });
      dispatch({ type: 'SET_PARTS', payload: partsFromFirebase });
    };

    if (activeTab === 'inventory') {
      refreshInventory();
    }
  }, [activeTab, dispatch]);

  const [isNewServiceDialogOpen, setIsNewServiceDialogOpen] = useState(false);
  const [isNewPartDialogOpen, setIsNewPartDialogOpen] = useState(false);

  const handleCreateService = async (serviceData: Omit<ServiceItem, 'id'>) => {
    try {
      const newServiceFromDB = await createService(serviceData);
      dispatch({ type: 'ADD_SERVICE', payload: newServiceFromDB });
      setIsNewServiceDialogOpen(false); // Cerramos el modal
    } catch (error) {
      console.error("Error al crear el servicio:", error);
      alert("No se pudo crear el servicio. Inténtalo de nuevo.");
    }
  };

  const handleCreatePart = async (partData: Omit<PartItem, 'id'>) => {
    try {
      const newPartFromDB = await createPart(partData);
      dispatch({ type: 'ADD_PART', payload: newPartFromDB });
      setIsNewPartDialogOpen(false); // Cerramos el modal
    } catch (error) {
      console.error("Error al crear la pieza:", error);
      alert("No se pudo crear la pieza. Inténtalo de nuevo.");
    }
  };

  const handleUpdateService = (serviceData: ServiceItem) => {
      dispatch({ type: 'UPDATE_SERVICE', payload: serviceData });
  };

  const handleUpdatePart = (partData: PartItem) => {
      dispatch({ type: 'UPDATE_PART', payload: partData });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Columna de Servicios */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Servicios</CardTitle>
            <CardDescription>Servicios ofrecidos en el taller</CardDescription>
          </div>
          <Dialog open={isNewServiceDialogOpen} onOpenChange={setIsNewServiceDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-2" />Nuevo Servicio</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Servicio</DialogTitle>
              </DialogHeader>
              <ItemForm onSave={handleCreateService} itemType="service" />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="w-[100px] text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.services.map(service => (
                <TableRow key={service.id}>
                  <TableCell>{service.name}</TableCell>
                  <TableCell className="text-right">${service.price.toLocaleString()}</TableCell>
                  <TableCell className="text-center space-x-2">
                    <EditItemDialog item={service} onSave={handleUpdateService} itemType="service" />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="h-auto px-2 py-1 text-xs"><Trash2 className="h-3 w-3" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente el servicio.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => dispatch({ type: 'DELETE_SERVICE', payload: service.id })}>Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Columna de Piezas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Inventario de Piezas</CardTitle>
            <CardDescription>Piezas y repuestos en stock</CardDescription>
          </div>
           <Dialog open={isNewPartDialogOpen} onOpenChange={setIsNewPartDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-2" />Nueva Pieza</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Pieza</DialogTitle>
              </DialogHeader>
              <ItemForm onSave={handleCreatePart} itemType="part" />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Precio Costo</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead className="w-[100px] text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.parts.map(part => (
                <TableRow key={part.id}>
                  <TableCell>{part.name}</TableCell>
                  <TableCell>{part.code || '-'}</TableCell>
                  <TableCell>{part.stock}</TableCell>
                  <TableCell className="text-right">${part.price.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{part.costPrice ? `$${part.costPrice.toLocaleString()}` : '-'}</TableCell>
                  <TableCell>{part.department || '-'}</TableCell>
                  <TableCell className="text-center space-x-2">
                    <EditItemDialog item={part} onSave={handleUpdatePart} itemType="part" />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="h-auto px-2 py-1 text-xs"><Trash2 className="h-3 w-3" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente la pieza.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => dispatch({ type: 'DELETE_PART', payload: part.id })}>Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}