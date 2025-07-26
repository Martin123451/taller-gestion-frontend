import { User, Client, Bicycle, ServiceItem, PartItem, WorkOrder, WorkOrderStatus } from './types';

export const mockUsers: User[] = [
  {
    id: 'admin-1',
    name: 'Carlos Rodríguez',
    email: 'admin@marchantbike.com',
    role: 'admin',
    createdAt: new Date('2024-01-15')
  },
  {
    id: 'mechanic-1',
    name: 'Miguel Torres',
    email: 'miguel@marchantbike.com',
    role: 'mechanic',
    createdAt: new Date('2024-01-20')
  },
  {
    id: 'mechanic-2',
    name: 'Ana López',
    email: 'ana@marchantbike.com',
    role: 'mechanic',
    createdAt: new Date('2024-02-01')
  }
];

export const mockClients: Client[] = [
  {
    id: 'client-1',
    name: 'Juan Pérez',
    email: 'juan@email.com',
    phone: '+56912345678',
    address: 'Av. Los Leones 123, Las Condes',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10')
  },
  {
    id: 'client-2',
    name: 'María González',
    email: 'maria@email.com',
    phone: '+56987654321',
    address: 'Calle Principal 456, Providencia',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'client-3',
    name: 'Pedro Silva',
    email: 'pedro@email.com',
    phone: '+56911223344',
    address: 'Av. Cristóbal Colón 789, Las Condes',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01')
  },
  {
    id: 'client-4',
    name: 'Laura Martín',
    email: 'laura@email.com',
    phone: '+56955667788',
    address: 'San Martín 321, Ñuñoa',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10')
  }
];

export const mockBicycles: Bicycle[] = [
  {
    id: 'bike-1',
    clientId: 'client-1',
    brand: 'Trek',
    model: 'Marlin 7',
    type: 'mountain',
    color: 'Azul',
    serialNumber: 'TRK789123',
    year: 2023,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10')
  },
  {
    id: 'bike-2',
    clientId: 'client-2',
    brand: 'Giant',
    model: 'Escape 3',
    type: 'hybrid',
    color: 'Blanco',
    serialNumber: 'GNT456789',
    year: 2022,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'bike-3',
    clientId: 'client-1',
    brand: 'Specialized',
    model: 'Rockhopper',
    type: 'mountain',
    color: 'Rojo',
    serialNumber: 'SPZ321654',
    year: 2023,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01')
  },
  {
    id: 'bike-4',
    clientId: 'client-3',
    brand: 'Cannondale',
    model: 'CAAD13',
    type: 'road',
    color: 'Negro',
    serialNumber: 'CND987654',
    year: 2024,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01')
  },
  {
    id: 'bike-5',
    clientId: 'client-4',
    brand: 'Scott',
    model: 'Spark 970',
    type: 'mountain',
    color: 'Verde',
    serialNumber: 'SCT147258',
    year: 2023,
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10')
  }
];

export const mockServices: ServiceItem[] = [
  {
    id: 'service-1',
    name: 'Mantención básica',
    description: 'Lubricación de cadena, ajuste de frenos y cambios',
    price: 15000,
    estimatedTime: 30
  },
  {
    id: 'service-2',
    name: 'Mantención completa',
    description: 'Servicio completo de bicicleta incluyendo limpieza profunda',
    price: 35000,
    estimatedTime: 90
  },
  {
    id: 'service-3',
    name: 'Cambio de neumáticos',
    description: 'Instalación de nuevos neumáticos',
    price: 8000,
    estimatedTime: 20
  },
  {
    id: 'service-4',
    name: 'Ajuste de frenos',
    description: 'Calibración y ajuste de sistema de frenos',
    price: 12000,
    estimatedTime: 25
  },
  {
    id: 'service-5',
    name: 'Reparación de cadena',
    description: 'Reparación o reemplazo de eslabones de cadena',
    price: 10000,
    estimatedTime: 15
  }
];

export const mockParts: PartItem[] = [
  {
    id: 'part-1',
    name: 'Neumático MTB 26"',
    description: 'Neumático para bicicleta de montaña',
    price: 25000,
    brand: 'Continental',
    partNumber: 'CTL-26-01'
  },
  {
    id: 'part-2',
    name: 'Cadena 11 velocidades',
    description: 'Cadena para sistema de 11 velocidades',
    price: 35000,
    brand: 'Shimano',
    partNumber: 'SHM-CH-11'
  },
  {
    id: 'part-3',
    name: 'Pastillas de freno',
    description: 'Pastillas de freno de disco',
    price: 18000,
    brand: 'Shimano',
    partNumber: 'SHM-BP-01'
  },
  {
    id: 'part-4',
    name: 'Cable de cambios',
    description: 'Cable de acero para cambios',
    price: 5000,
    brand: 'Jagwire',
    partNumber: 'JAG-SC-01'
  },
  {
    id: 'part-5',
    name: 'Cámara 26"',
    description: 'Cámara de aire para neumático 26 pulgadas',
    price: 8000,
    brand: 'Schwalbe',
    partNumber: 'SCH-TB-26'
  }
];

export const mockWorkOrders: WorkOrder[] = [
  {
    id: 'wo-1',
    clientId: 'client-1',
    client: mockClients[0],
    bicycleId: 'bike-1',
    bicycle: mockBicycles[0],
    description: 'Bicicleta presenta ruidos en la transmisión y frenos poco efectivos',
    status: 'open' as WorkOrderStatus,
    services: [],
    parts: [],
    totalAmount: 0,
    createdAt: new Date('2024-07-20'),
    updatedAt: new Date('2024-07-20')
  },
  {
    id: 'wo-2',
    clientId: 'client-2',
    client: mockClients[1],
    bicycleId: 'bike-2',
    bicycle: mockBicycles[1],
    description: 'Mantención preventiva completa, cambios no funcionan correctamente',
    status: 'in_progress' as WorkOrderStatus,
    mechanicId: 'mechanic-1',
    mechanic: mockUsers[1],
    services: [
      {
        id: 'wos-1',
        serviceId: 'service-2',
        service: mockServices[1],
        quantity: 1,
        price: 35000,
        notes: 'Mantención completa programada'
      }
    ],
    parts: [
      {
        id: 'wop-1',
        partId: 'part-4',
        part: mockParts[3],
        quantity: 2,
        price: 10000,
        notes: 'Cables de cambio trasero y delantero'
      }
    ],
    totalAmount: 45000,
    startedAt: new Date('2024-07-22T09:30:00'),
    workTimeMinutes: 45,
    createdAt: new Date('2024-07-21'),
    updatedAt: new Date('2024-07-22T09:30:00')
  },
  {
    id: 'wo-3',
    clientId: 'client-3',
    client: mockClients[2],
    bicycleId: 'bike-4',
    bicycle: mockBicycles[3],
    description: 'Neumático pinchado y ajuste general necesario',
    status: 'ready_for_delivery' as WorkOrderStatus,
    mechanicId: 'mechanic-2',
    mechanic: mockUsers[2],
    services: [
      {
        id: 'wos-2',
        serviceId: 'service-3',
        service: mockServices[2],
        quantity: 1,
        price: 8000,
        notes: 'Cambio de neumático trasero'
      },
      {
        id: 'wos-3',
        serviceId: 'service-1',
        service: mockServices[0],
        quantity: 1,
        price: 15000,
        notes: 'Mantención básica incluida'
      }
    ],
    parts: [
      {
        id: 'wop-2',
        partId: 'part-5',
        part: mockParts[4],
        quantity: 1,
        price: 8000,
        notes: 'Cámara nueva instalada'
      }
    ],
    totalAmount: 31000,
    startedAt: new Date('2024-07-23T10:00:00'),
    completedAt: new Date('2024-07-23T11:15:00'),
    workTimeMinutes: 75,
    mechanicNotes: 'Trabajo completado. Neumático y cámara nuevos instalados. Bicicleta lista para entrega.',
    createdAt: new Date('2024-07-22'),
    updatedAt: new Date('2024-07-23T11:15:00')
  },
  {
    id: 'wo-4',
    clientId: 'client-4',
    client: mockClients[3],
    bicycleId: 'bike-5',
    bicycle: mockBicycles[4],
    description: 'Cadena rota, necesita reemplazo urgente',
    status: 'open' as WorkOrderStatus,
    services: [],
    parts: [],
    totalAmount: 0,
    createdAt: new Date('2024-07-24'),
    updatedAt: new Date('2024-07-24')
  },
  {
    id: 'wo-5',
    clientId: 'client-1',
    client: mockClients[0],
    bicycleId: 'bike-3',
    bicycle: mockBicycles[2],
    description: 'Mantención programada y revisión de suspensión',
    status: 'completed' as WorkOrderStatus,
    mechanicId: 'mechanic-1',
    mechanic: mockUsers[1],
    services: [
      {
        id: 'wos-4',
        serviceId: 'service-2',
        service: mockServices[1],
        quantity: 1,
        price: 35000,
        notes: 'Mantención completa realizada'
      }
    ],
    parts: [],
    totalAmount: 35000,
    startedAt: new Date('2024-07-18T14:00:00'),
    completedAt: new Date('2024-07-18T15:30:00'),
    deliveredAt: new Date('2024-07-19T10:00:00'),
    workTimeMinutes: 90,
    adminNotes: 'Cliente satisfecho con el trabajo. Bicicleta entregada sin problemas.',
    mechanicNotes: 'Suspensión ajustada correctamente. Todo funcionando perfecto.',
    createdAt: new Date('2024-07-18'),
    updatedAt: new Date('2024-07-19T10:00:00')
  }
];