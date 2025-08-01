import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AppState, User, Client, Bicycle, WorkOrder, ServiceItem, PartItem, WorkOrderStatus } from '../lib/types';
import { mockUsers, mockClients, mockBicycles, mockWorkOrders, mockServices, mockParts } from '../lib/mockData';
import { getServices, createService, updateService, deleteService } from '../services/services';
import { getParts, createPart, updatePart, deletePart } from '../services/parts';

type AppAction = 
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'ADD_CLIENT'; payload: Client }
  | { type: 'UPDATE_CLIENT'; payload: Client }
  | { type: 'ADD_BICYCLE'; payload: Bicycle }
  | { type: 'UPDATE_BICYCLE'; payload: Bicycle }
  | { type: 'ADD_WORK_ORDER'; payload: WorkOrder }
  | { type: 'UPDATE_WORK_ORDER'; payload: WorkOrder }
  | { type: 'START_WORK_ORDER'; payload: { workOrderId: string; mechanicId: string } }
  | { type: 'COMPLETE_WORK_ORDER'; payload: string }
  | { type: 'DELIVER_WORK_ORDER'; payload: string }
  | { type: 'UPDATE_WORK_TIME'; payload: { workOrderId: string; minutes: number } }
  | { type: 'SET_SERVICES'; payload: ServiceItem[] }
  | { type: 'SET_PARTS'; payload: PartItem[] }
  | { type: 'ADD_SERVICE'; payload: ServiceItem }
  | { type: 'UPDATE_SERVICE'; payload: ServiceItem }
  | { type: 'ADD_PART'; payload: PartItem }
  | { type: 'DELETE_SERVICE'; payload: string }
  | { type: 'DELETE_PART'; payload: string }
  | { type: 'UPDATE_PART'; payload: PartItem };

const initialState: AppState = {
  currentUser: null,
  users: mockUsers, // <-- LÍNEA AÑADIDA
  clients: mockClients,
  bicycles: mockBicycles,
  workOrders: mockWorkOrders,
  services: [],
  parts: [],
  isLoading: false
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, currentUser: action.payload };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'ADD_CLIENT':
      return { ...state, clients: [...state.clients, action.payload] };
    
    case 'UPDATE_CLIENT':
      return {
        ...state,
        clients: state.clients.map(client => 
          client.id === action.payload.id ? action.payload : client
        )
      };
    
    case 'ADD_BICYCLE':
      return { ...state, bicycles: [...state.bicycles, action.payload] };
    
    case 'UPDATE_BICYCLE':
      return {
        ...state,
        bicycles: state.bicycles.map(bicycle => 
          bicycle.id === action.payload.id ? action.payload : bicycle
        )
      };
    
    case 'ADD_WORK_ORDER':
      return { ...state, workOrders: [...state.workOrders, action.payload] };
    
    case 'UPDATE_WORK_ORDER':
      return {
        ...state,
        workOrders: state.workOrders.map(wo => 
          wo.id === action.payload.id ? action.payload : wo
        )
      };
    
    case 'START_WORK_ORDER':
      return {
        ...state,
        workOrders: state.workOrders.map(wo => 
          wo.id === action.payload.workOrderId 
            ? { 
                ...wo, 
                status: 'in_progress' as WorkOrderStatus,
                mechanicId: action.payload.mechanicId,
                mechanic: state.currentUser || undefined,
                startedAt: new Date(),
                updatedAt: new Date()
              }
            : wo
        )
      };
    
    case 'COMPLETE_WORK_ORDER':
      return {
        ...state,
        workOrders: state.workOrders.map(wo => 
          wo.id === action.payload 
            ? { 
                ...wo, 
                status: 'ready_for_delivery' as WorkOrderStatus,
                completedAt: new Date(),
                updatedAt: new Date()
              }
            : wo
        )
      };
    
    case 'DELIVER_WORK_ORDER':
      return {
        ...state,
        workOrders: state.workOrders.map(wo => 
          wo.id === action.payload 
            ? { 
                ...wo, 
                status: 'completed' as WorkOrderStatus,
                deliveredAt: new Date(),
                updatedAt: new Date()
              }
            : wo
        )
      };
    
    case 'UPDATE_WORK_TIME':
      return {
        ...state,
        workOrders: state.workOrders.map(wo => 
          wo.id === action.payload.workOrderId 
            ? { ...wo, workTimeMinutes: action.payload.minutes }
            : wo
        )
      };

    case 'SET_SERVICES':
      return { ...state, services: action.payload };

    case 'SET_PARTS':
      return { ...state, parts: action.payload };

    case 'ADD_SERVICE':
      return { ...state, services: [...state.services, action.payload] };

    case 'UPDATE_SERVICE':
      updateService(action.payload.id, action.payload); // Llama a Firebase
      return {
        ...state,
        services: state.services.map(s => 
          s.id === action.payload.id ? action.payload : s
        )
      };

    case 'ADD_PART':
      return { ...state, parts: [...state.parts, action.payload] };

    case 'UPDATE_PART':
      updatePart(action.payload.id, action.payload); // Llama a Firebase
      return {
        ...state,
        parts: state.parts.map(p => 
          p.id === action.payload.id ? action.payload : p
        )
      };

    case 'DELETE_SERVICE':
    // Llama a la función de Firebase para borrar en la base de datos
    deleteService(action.payload); 
    // Actualiza la lista en el frontend para que el cambio se vea al instante
    return {
      ...state,
      services: state.services.filter(s => s.id !== action.payload)
    };

  case 'DELETE_PART':
    // Llama a la función de Firebase para borrar en la base de datos
    deletePart(action.payload); 
    // Actualiza la lista en el frontend
    return {
      ...state,
      parts: state.parts.filter(p => p.id !== action.payload)
    };
    
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
      const fetchInventory = async () => {
        // Solo se ejecuta la carga si las listas en el estado están vacías.
        // Esto previene la duplicación de datos en el modo de desarrollo.
        if (state.services.length === 0 && state.parts.length === 0) {
          const servicesFromFirebase = await getServices();
          const partsFromFirebase = await getParts();
          dispatch({ type: 'SET_SERVICES', payload: servicesFromFirebase });
          dispatch({ type: 'SET_PARTS', payload: partsFromFirebase });
        }
      };
      fetchInventory();
    }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

// Helper hooks
export function useAuth() {
  const { state, dispatch } = useApp();
  
  const login = (email: string, password: string) => {
    // Simulate login
    const user = mockUsers.find(u => u.email === email);
    if (user) {
      dispatch({ type: 'SET_USER', payload: user });
      return true;
    }
    return false;
  };

  const logout = () => {
    dispatch({ type: 'SET_USER', payload: null });
  };

  return {
    user: state.currentUser,
    login,
    logout,
    isAuthenticated: !!state.currentUser
  };
}