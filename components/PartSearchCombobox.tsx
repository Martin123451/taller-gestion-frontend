import React, { useState, useMemo, useRef } from 'react';
import { Check, ChevronsUpDown, Plus, Package } from 'lucide-react';
import { Button } from './ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Badge } from './ui/badge';
import { PartItem } from '../lib/types';

interface PartSearchComboboxProps {
  parts: PartItem[];
  selectedParts?: string[]; // Array de IDs de partes ya seleccionadas
  onSelectPart: (partId: string) => void;
  placeholder?: string;
  className?: string;
}

export default function PartSearchCombobox({ 
  parts, 
  selectedParts = [], 
  onSelectPart, 
  placeholder = "Buscar y agregar pieza...",
  className = "w-48"
}: PartSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const isTransitioningRef = useRef(false);

  const filteredParts = useMemo(() => {
    if (!searchQuery) {
      return parts.filter(part => 
        !selectedParts.includes(part.id) && part.stock > 0
      );
    }

    const lowerCaseQuery = searchQuery.toLowerCase().trim();
    if (!lowerCaseQuery) {
        return parts.filter(part => 
          !selectedParts.includes(part.id) && part.stock > 0
        );
    }

    return parts.filter(part => {
      // Excluir partes ya seleccionadas o sin stock
      if (selectedParts.includes(part.id) || part.stock <= 0) return false;
      
      const nameMatch = part.name.toLowerCase().includes(lowerCaseQuery);
      const descriptionMatch = part.description && part.description.toLowerCase().includes(lowerCaseQuery);
      const categoryMatch = part.category && part.category.toLowerCase().includes(lowerCaseQuery);
      const priceMatch = part.price.toString().includes(lowerCaseQuery);

      return nameMatch || descriptionMatch || categoryMatch || priceMatch;
    });
  }, [searchQuery, parts, selectedParts]);

  const handleSelectPart = (partId: string) => {
    onSelectPart(partId);
    setSearchQuery(''); // Limpiar búsqueda después de seleccionar
    setOpen(false);
  };

  const getStockBadgeVariant = (stock: number) => {
    if (stock === 0) return 'destructive';
    if (stock <= 5) return 'secondary';
    return 'default';
  };

  const getStockBadgeText = (stock: number) => {
    if (stock === 0) return 'Sin stock';
    if (stock <= 5) return 'Poco stock';
    return 'En stock';
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`${className} justify-between font-normal`}
        >
          {placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        onCloseAutoFocus={(e) => {
          if (isTransitioningRef.current) {
            e.preventDefault();
            isTransitioningRef.current = false;
          }
        }}
      >
        <Command>
          <CommandInput
            placeholder="Buscar por nombre, categoría o precio..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              <div className="py-4 text-center text-sm">
                <p>No se encontraron piezas disponibles.</p>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {filteredParts.map((part) => (
                <CommandItem
                  key={part.id}
                  value={part.name}
                  onSelect={() => handleSelectPart(part.id)}
                  className="cursor-pointer"
                >
                  <Plus className="mr-2 h-4 w-4 text-marchant-red" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{part.name}</p>
                      <p className="text-sm font-semibold text-marchant-red">
                        ${part.price.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant={getStockBadgeVariant(part.stock)}
                        className="text-xs"
                      >
                        <Package className="w-3 h-3 mr-1" />
                        {part.stock} {getStockBadgeText(part.stock)}
                      </Badge>
                      {part.category && (
                        <span className="text-xs text-muted-foreground">
                          {part.category}
                        </span>
                      )}
                    </div>
                    {part.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {part.description}
                      </p>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}