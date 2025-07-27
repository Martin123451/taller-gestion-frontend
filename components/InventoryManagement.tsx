import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Plus } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { ServiceItem, PartItem } from '../lib/types';
import EditItemDialog from './EditItemDialog'; // <-- 1. IMPORTAMOS EL NUEVO COMPONENTE

// El formulario de creación no ha cambiado
const ItemForm = ({ onSave, itemType }: { onSave: (item: any) => void, itemType: 'service' | 'part' }) => {
    const [formData, setFormData] = useState({ name: '', price: 0, ...(itemType === 'part' && { stock: 0, brand: '' }) });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type } = e.target;
        setFormData(prev => ({ ...prev, [id]: type === 'number' ? parseFloat(value) || 0 : value }));
    };

    return (
        <div className="space-y-4">
        <div>
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" value={formData.name} onChange={handleChange} />
        </div>
        <div>
            <Label htmlFor="price">Precio</Label>
            <Input id="price" type="number" value={formData.price} onChange={handleChange} />
        </div>
        {itemType === 'part' && (
            <>
            <div>
                <Label htmlFor="stock">Stock</Label>
                <Input id="stock" type="number" value={(formData as PartItem).stock} onChange={handleChange} />
            </div>
            <div>
                <Label htmlFor="brand">Marca</Label>
                <Input id="brand" value={(formData as PartItem).brand} onChange={handleChange} />
            </div>
            </>
        )}
        <Button onClick={() => onSave(formData)} className="w-full">Guardar</Button>
        </div>
    );
};

export default function InventoryManagement() {
  const { state, dispatch } = useApp();

  const handleSaveService = (serviceData: ServiceItem) => {
    if (serviceData.id) {
      dispatch({ type: 'UPDATE_SERVICE', payload: serviceData });
    } else {
      dispatch({ type: 'ADD_SERVICE', payload: { ...serviceData, id: `service-${Date.now()}` } });
    }
  };

  const handleSavePart = (partData: PartItem) => {
    if (partData.id) {
      dispatch({ type: 'UPDATE_PART', payload: partData });
    } else {
      dispatch({ type: 'ADD_PART', payload: { ...partData, id: `part-${Date.now()}` } });
    }
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
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-2" />Nuevo Servicio</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Servicio</DialogTitle>
              </DialogHeader>
              <ItemForm onSave={handleSaveService} itemType="service" />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="w-[100px] text-center">Acciones</TableHead> {/* <-- 2. AÑADIMOS LA CABECERA */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.services.map(service => (
                <TableRow key={service.id}>
                  <TableCell>{service.name}</TableCell>
                  <TableCell className="text-right">${service.price.toLocaleString()}</TableCell>
                  <TableCell className="text-center"> {/* <-- 3. AÑADIMOS LA CELDA CON EL BOTÓN */}
                    <EditItemDialog item={service} onSave={handleSaveService} itemType="service" />
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
           <Dialog>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-2" />Nueva Pieza</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Pieza</DialogTitle>
              </DialogHeader>
              <ItemForm onSave={handleSavePart} itemType="part" />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="w-[100px] text-center">Acciones</TableHead> {/* <-- 2. AÑADIMOS LA CABECERA */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.parts.map(part => (
                <TableRow key={part.id}>
                  <TableCell>{part.name}</TableCell>
                  <TableCell>{part.stock}</TableCell>
                  <TableCell className="text-right">${part.price.toLocaleString()}</TableCell>
                  <TableCell className="text-center"> {/* <-- 3. AÑADIMOS LA CELDA CON EL BOTÓN */}
                    <EditItemDialog item={part} onSave={handleSavePart} itemType="part" />
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