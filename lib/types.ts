export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'mechanic';
  createdAt: Date;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Bicycle {
  id: string;
  clientId: string;
  brand: string;
  model: string;
  type: 'mountain' | 'road' | 'hybrid' | 'electric' | 'bmx' | 'other';
  color: string;
  serialNumber?: string;
  year?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  estimatedTime?: number; // in minutes
}

export interface PartItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  brand?: string;
  partNumber?: string;
  stock: number;
}

export interface WorkOrderService {
  id: string;
  serviceId: string;
  service: ServiceItem;
  quantity: number;
  price: number;
  notes?: string;
  createdAt: Date;
}

export interface WorkOrderPart {
  id: string;
  partId: string;
  part: PartItem;
  quantity: number;
  price: number;
  notes?: string;
  createdAt: Date;
}

export type WorkOrderStatus = 'open' | 'in_progress' | 'ready_for_delivery' | 'completed';

export interface WorkOrder {
  id: string;
  clientId: string;
  client: Client;
  bicycleId: string;
  bicycle: Bicycle;
  description: string;
  status: WorkOrderStatus;
  services: WorkOrderService[];
  parts: WorkOrderPart[];
  totalAmount: number;
  mechanicId?: string;
  mechanic?: User;
  startedAt?: Date;
  completedAt?: Date;
  deliveredAt?: Date;
  workTimeMinutes?: number;
  adminNotes?: string;
  mechanicNotes?: string;
  estimatedDeliveryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  needsQuote?: boolean;
  originalServices?: WorkOrderService[];
  originalParts?: WorkOrderPart[];
  originalAmount?: number;
  quote?: {
    status: 'pending' | 'sent' | 'approved' | 'rejected';
    sentAt?: Date;
    respondedAt?: Date;
    clientResponse?: string;
  };
}

export interface AppState {
  currentUser: User | null;
  users: User[]; // <-- LÍNEA AÑADIDA
  clients: Client[];
  bicycles: Bicycle[];
  workOrders: WorkOrder[];
  services: ServiceItem[];
  parts: PartItem[];
  isLoading: boolean;
}