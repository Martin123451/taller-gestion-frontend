import React, { useState, useMemo, useRef } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ServiceItem } from '../lib/types';

interface ServiceSearchComboboxProps {
  services: ServiceItem[];
  selectedServices?: string[]; // Array de IDs de servicios ya seleccionados
  onSelectService: (serviceId: string) => void;
  placeholder?: string;
  className?: string;
}

export default function ServiceSearchCombobox({ 
  services, 
  selectedServices = [], 
  onSelectService, 
  placeholder = "Buscar y agregar servicio...",
  className = "w-48"
}: ServiceSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const isTransitioningRef = useRef(false);

  const filteredServices = useMemo(() => {
    if (!searchQuery) {
      return services.filter(service => !selectedServices.includes(service.id));
    }

    const lowerCaseQuery = searchQuery.toLowerCase().trim();
    if (!lowerCaseQuery) {
        return services.filter(service => !selectedServices.includes(service.id));
    }

    return services.filter(service => {
      // Excluir servicios ya seleccionados
      if (selectedServices.includes(service.id)) return false;
      
      const nameMatch = service.name.toLowerCase().includes(lowerCaseQuery);
      const descriptionMatch = service.description && service.description.toLowerCase().includes(lowerCaseQuery);
      const priceMatch = service.price.toString().includes(lowerCaseQuery);

      return nameMatch || descriptionMatch || priceMatch;
    });
  }, [searchQuery, services, selectedServices]);

  const handleSelectService = (serviceId: string) => {
    onSelectService(serviceId);
    setSearchQuery(''); // Limpiar búsqueda después de seleccionar
    setOpen(false);
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
            placeholder="Buscar por nombre, descripción o precio..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              <div className="py-4 text-center text-sm">
                <p>No se encontraron servicios.</p>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {filteredServices.map((service) => (
                <CommandItem
                  key={service.id}
                  value={service.name}
                  onSelect={() => handleSelectService(service.id)}
                  className="cursor-pointer"
                >
                  <Plus className="mr-2 h-4 w-4 text-marchant-green" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{service.name}</p>
                      <p className="text-sm font-semibold text-marchant-green">
                        ${service.price.toLocaleString()}
                      </p>
                    </div>
                    {service.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {service.description}
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