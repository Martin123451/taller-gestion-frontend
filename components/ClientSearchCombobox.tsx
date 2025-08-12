import React, { useState, useMemo, useRef } from 'react';
import { Check, ChevronsUpDown, PlusCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Client } from '../lib/types';
import { useApp } from '../contexts/AppContext';

interface ClientSearchComboboxProps {
  selectedClientId: string | null;
  onSelectClient: (clientId: string) => void;
  onAddNewClient: () => void;
}

export default function ClientSearchCombobox({ selectedClientId, onSelectClient, onAddNewClient }: ClientSearchComboboxProps) {
  const { state } = useApp();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const isTransitioningRef = useRef(false);

  const selectedClientName = useMemo(() => {
    return state.clients.find(client => client.id === selectedClientId)?.name || "Buscar y seleccionar cliente...";
  }, [selectedClientId, state.clients]);

  const filteredClients = useMemo(() => {
    if (!searchQuery) {
      return state.clients;
    }

    const lowerCaseQuery = searchQuery.toLowerCase().trim();
    if (!lowerCaseQuery) {
        return state.clients;
    }

    return state.clients.filter(client => {
      const nameMatch = client.name.toLowerCase().includes(lowerCaseQuery);
      const emailMatch = client.email && client.email.toLowerCase().includes(lowerCaseQuery);
      const phoneMatch = client.phone && client.phone.includes(lowerCaseQuery);

      return nameMatch || emailMatch || phoneMatch;
    });
  }, [searchQuery, state.clients]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selectedClientName}
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
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              <div className="py-4 text-center text-sm">
                <p>No se encontró el cliente.</p>
                <Button variant="link" className="text-blue-600 h-auto p-1 mt-1" onClick={() => {
                  isTransitioningRef.current = true;
                  onAddNewClient();
                  setOpen(false);
                }}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Crear nuevo cliente
                </Button>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {filteredClients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={client.name} // <-- ESTE ES EL CAMBIO
                  onSelect={() => {
                    onSelectClient(client.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${selectedClientId === client.id ? "opacity-100" : "opacity-0"}`}
                  />
                  <div>
                    <p>{client.name}</p>
                    <p className="text-xs text-muted-foreground">{client.email}</p>
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