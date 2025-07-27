// components/EditItemDialog.tsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Edit } from 'lucide-react';
import { ServiceItem, PartItem } from '../lib/types';

interface EditItemDialogProps {
  item: ServiceItem | PartItem;
  onSave: (item: ServiceItem | PartItem) => void;
  itemType: 'service' | 'part';
}

export default function EditItemDialog({ item, onSave, itemType }: EditItemDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState(item);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type } = e.target;
    setFormData(prev => ({ ...prev, [id]: type === 'number' ? parseFloat(value) || 0 : value }));
  };

  const handleSave = () => {
    onSave(formData);
    setIsOpen(false); // Cierra el diálogo después de guardar
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-auto px-2 py-1 text-xs">
          <Edit className="h-3 w-3 mr-1" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar {itemType === 'service' ? 'Servicio' : 'Pieza'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" value={formData.name} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="price">Precio</Label>
            <Input id="price" type="number" value={formData.price} onChange={handleChange} />
          </div>

          {/* --- ESTA ES LA CORRECCIÓN CLAVE --- */}
          {itemType === 'part' && (
            <>
              <div>
                <Label htmlFor="stock">Stock</Label>
                <Input id="stock" type="number" value={(formData as PartItem).stock} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="brand">Marca</Label>
                <Input id="brand" value={(formData as PartItem).brand || ''} onChange={handleChange} />
              </div>
            </>
          )}
          {/* ------------------------------------ */}

          <Button onClick={handleSave} className="w-full">Guardar Cambios</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}