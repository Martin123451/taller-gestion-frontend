// components/ClientSearchCombobox.tsx
import React, { useState } from 'react';
import { Check, ChevronsUpDown, PlusCircle } from 'lucide-react';
import { cn } from "./ui/utils";
import { Button } from './ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { useApp } from '../contexts/AppContext';
import { Client } from '../lib/types';

interface ClientSearchComboboxProps {
  selectedClientId: string;
  onSelectClient: (clientId: string) => void;
  onAddNewClient: () => void;
}

export default function ClientSearchCombobox({ selectedClientId, onSelectClient, onAddNewClient }: ClientSearchComboboxProps) {
  const { state } = useApp();
  const [open, setOpen] = useState(false);

  const selectedClient = state.clients.find(c => c.id === selectedClientId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedClient ? selectedClient.name : "Buscar y seleccionar cliente..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Buscar cliente por nombre..." />
          <CommandList>
            <CommandEmpty>
                <p className="p-4 text-sm text-center">No se encontró el cliente.</p>
            </CommandEmpty>
            <CommandGroup>
              {state.clients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={client.name}
                  onSelect={() => {
                    onSelectClient(client.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedClientId === client.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {client.name}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandItem
              onSelect={() => {
                onAddNewClient();
                setOpen(false);
              }}
              className="bg-green-50 hover:bg-green-100 text-green-700 mt-2"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Agregar nuevo cliente
            </CommandItem>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}