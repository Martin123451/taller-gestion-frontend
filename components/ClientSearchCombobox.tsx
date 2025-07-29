import React, { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, PlusCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Client } from '../lib/types';

interface ClientSearchComboboxProps {
  clients: Client[];
  selectedClientId: string | null;
  onSelectClient: (clientId: string) => void;
  onAddNewClient: () => void;
}

export default function ClientSearchCombobox({ clients, selectedClientId, onSelectClient, onAddNewClient }: ClientSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedClientName = useMemo(() => {
    return clients.find(client => client.id === selectedClientId)?.name || "Buscar y seleccionar cliente...";
  }, [selectedClientId, clients]);

  const filteredClients = useMemo(() => {
    if (!searchQuery) return clients;
    return clients.filter(client => 
      client.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, clients]);

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
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput 
            placeholder="Buscar cliente por nombre..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              <div className="py-4 text-center text-sm">
                <p>No se encontró el cliente.</p>
                <Button variant="link" className="text-blue-600 h-auto p-1 mt-1" onClick={() => {
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
                  value={client.id}
                  onSelect={() => {
                    onSelectClient(client.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${selectedClientId === client.id ? "opacity-100" : "opacity-0"}`}
                  />
                  {client.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}