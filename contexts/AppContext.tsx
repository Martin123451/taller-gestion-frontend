import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AppState, User, Client, Bicycle, WorkOrder, ServiceItem, PartItem, WorkOrderStatus } from '../lib/types';
import { getServices, createService, updateService, deleteService } from '../services/services';
import { getParts, createPart, updatePart, deletePart } from '../services/parts';
import { getClients, createClient, updateClient, deleteClient } from '../services/clients';
import { getBicycles, createBicycle, updateBicycle, deleteBicycle } from '../services/bicycles';
import { getWorkOrders, createWorkOrder, startWorkOnOrder, completeWorkOnOrder, updateWorkOrder, deleteWorkOrder } from '../services/workOrders';
import { getUsers } from '../services/users';
import { collection, getDocs } from "firebase/firestore";
import { db } from '../firebase/config';

type AppAction =
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'ADD_CLIENT'; payload: Client }
  | { type: 'UPDATE_CLIENT'; payload: Client }
  | { type: 'DELETE_CLIENT'; payload: string }
  | { type: 'ADD_BICYCLE'; payload: Bicycle }
  | { type: 'UPDATE_BICYCLE'; payload: Bicycle }
  | { type: 'DELETE_BICYCLE'; payload: string }
  | { type: 'ADD_WORK_ORDER'; payload: WorkOrder }
  | { type: 'UPDATE_WORK_ORDER'; payload: WorkOrder }
  | { type: 'START_WORK_ORDER'; payload: { workOrderId: string; mechanicId: string } }
  | { type: 'COMPLETE_WORK_ORDER'; payload: string }
  | { type: 'DELIVER_WORK_ORDER'; payload: string }
  | { type: 'UPDATE_WORK_TIME'; payload: { workOrderId: string; minutes: number } }
  | { type: 'DELETE_WORK_ORDER'; payload: string }
  | { type: 'SET_SERVICES'; payload: ServiceItem[] }
  | { type: 'SET_PARTS'; payload: PartItem[] }
  | { type: 'ADD_SERVICE'; payload: ServiceItem }
  | { type: 'UPDATE_SERVICE'; payload: ServiceItem }
  | { type: 'ADD_PART'; payload: PartItem }
  | { type: 'DELETE_SERVICE'; payload: string }
  | { type: 'DELETE_PART'; payload: string }
  | { type: 'SET_CLIENTS'; payload: Client[] }
  | { type: 'SET_BICYCLES'; payload: Bicycle[] }
  | { type: 'SET_WORK_ORDERS'; payload: WorkOrder[] }
  | { type: 'START_WORK_ORDER'; payload: { workOrderId: string; mechanicId: string } }
  | { type: 'COMPLETE_WORK_ORDER'; payload: string }
  | { type: 'UPDATE_PART'; payload: PartItem }
  | { type: 'SEND_QUOTE'; payload: { workOrderId: string } }
  | { type: 'RESPOND_TO_QUOTE'; payload: { workOrderId: string; response: 'approved' | 'rejected' | 'partial_reject'; notes?: string; rejectedItems?: { services: string[]; parts: string[]; } } };

const initialState: Omit<AppState, 'currentUser'> = {
  users: [],
  clients: [],
  bicycles: [],
  workOrders: [],
  services: [],
  parts: [],
  isLoading: true
};

function appReducer(state: Omit<AppState, 'currentUser'>, action: AppAction): Omit<AppState, 'currentUser'> {
  switch (action.type) {
    case 'SET_USERS':
      return { ...state, users: action.payload };

    case 'SET_CLIENTS':
      return { ...state, clients: action.payload };

    case 'SET_BICYCLES':
      return { ...state, bicycles: action.payload };

    case 'SET_WORK_ORDERS':
      return { ...state, workOrders: action.payload };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'ADD_CLIENT':
      return { ...state, clients: [...state.clients, action.payload] };
    
    case 'UPDATE_CLIENT':
      updateClient(action.payload.id, action.payload);
      return {
        ...state,
        clients: state.clients.map(c => c.id === action.payload.id ? action.payload : c),
      };

    case 'DELETE_CLIENT':
      deleteClient(action.payload);
      return {
        ...state,
        clients: state.clients.filter(c => c.id !== action.payload),
      };
    
    case 'ADD_BICYCLE':
      return { ...state, bicycles: [...state.bicycles, action.payload] };
    
    case 'UPDATE_BICYCLE':
      updateBicycle(action.payload.id, action.payload);
      return {
        ...state,
        bicycles: state.bicycles.map(b => b.id === action.payload.id ? action.payload : b),
      };

    case 'DELETE_BICYCLE':
      deleteBicycle(action.payload);
      return {
        ...state,
        bicycles: state.bicycles.filter(b => b.id !== action.payload),
      };
    
    case 'ADD_WORK_ORDER':
      return { ...state, workOrders: [...state.workOrders, action.payload] };
    
    case 'UPDATE_WORK_ORDER':
      // Llama a la función de Firebase en segundo plano
      updateWorkOrder(action.payload.id, {
          services: action.payload.services,
          parts: action.payload.parts,
          totalAmount: action.payload.totalAmount,
          advancePayment: action.payload.advancePayment,
          mechanicNotes: action.payload.mechanicNotes,
          // ====================================================================
          // FIX: Incluir campos originales para preservarlos en Firebase
          // ====================================================================
          originalServices: action.payload.originalServices,
          originalParts: action.payload.originalParts,
          originalAmount: action.payload.originalAmount,
          needsQuote: action.payload.needsQuote
          // ====================================================================
      });
      // Actualiza el estado local para una respuesta visual instantánea
      return {
        ...state,
        workOrders: state.workOrders.map(wo => 
          wo.id === action.payload.id ? action.payload : wo
        ),
      };
      
    case 'START_WORK_ORDER':
      startWorkOnOrder(action.payload.workOrderId, action.payload.mechanicId);
      return {
        ...state,
        workOrders: state.workOrders.map(wo => 
          wo.id === action.payload.workOrderId 
            ? { ...wo, status: 'in_progress', startedAt: new Date(), mechanicId: action.payload.mechanicId } 
            : wo
        ),
      };
    
    case 'COMPLETE_WORK_ORDER':
      completeWorkOnOrder(action.payload);
      return {
        ...state,
        workOrders: state.workOrders.map(wo => 
          wo.id === action.payload 
            ? { ...wo, status: 'ready_for_delivery', completedAt: new Date() } 
            : wo
        ),
      };
    
    case 'DELIVER_WORK_ORDER':
      // Actualizar en Firebase
      updateWorkOrder(action.payload, {
        status: 'completed',
        deliveredAt: new Date()
      });
      
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

    case 'DELETE_WORK_ORDER':
      deleteWorkOrder(action.payload);
      return {
        ...state,
        workOrders: state.workOrders.filter(wo => wo.id !== action.payload),
      };

    case 'SET_SERVICES':
      return { ...state, services: action.payload };

    case 'SET_PARTS':
      return { ...state, parts: action.payload };

    case 'ADD_SERVICE':
      return { ...state, services: [...state.services, action.payload] };

    case 'UPDATE_SERVICE':
      updateService(action.payload.id, action.payload);
      return {
        ...state,
        services: state.services.map(s => 
          s.id === action.payload.id ? action.payload : s
        )
      };

    case 'ADD_PART':
      return { ...state, parts: [...state.parts, action.payload] };

    case 'UPDATE_PART':
      updatePart(action.payload.id, action.payload);
      return {
        ...state,
        parts: state.parts.map(p => 
          p.id === action.payload.id ? action.payload : p
        )
      };

    case 'DELETE_SERVICE':
      deleteService(action.payload); 
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

  case 'SEND_QUOTE':
    // Actualiza el estado de la cotización a 'sent'
    const currentWorkOrder = state.workOrders.find(wo => wo.id === action.payload.workOrderId);
    updateWorkOrder(action.payload.workOrderId, {
      quote: {
        ...currentWorkOrder?.quote,
        status: 'sent',
        sentAt: new Date()
      }
    });
    return {
      ...state,
      workOrders: state.workOrders.map(wo => 
        wo.id === action.payload.workOrderId 
          ? { 
              ...wo, 
              quote: {
                ...wo.quote,
                status: 'sent',
                sentAt: new Date()
              }
            }
          : wo
      )
    };

  case 'RESPOND_TO_QUOTE':
    const workOrder = state.workOrders.find(wo => wo.id === action.payload.workOrderId);
    if (!workOrder) return state;

    let newTotalAmount = workOrder.totalAmount;
    let updatedServices = workOrder.services;
    let updatedParts = workOrder.parts;

    // Si es rechazo total, volver al monto original pero mantener items para mostrar como rechazados
    if (action.payload.response === 'rejected') {
      newTotalAmount = workOrder.originalAmount || 0;
      // No eliminamos los items, solo ajustamos el total
    } 
    // Si es rechazo parcial, calcular el total solo con items aprobados
    else if (action.payload.response === 'partial_reject' && action.payload.rejectedItems) {
      const rejectedServiceIds = action.payload.rejectedItems.services || [];
      const rejectedPartIds = action.payload.rejectedItems.parts || [];
      
      // Calcular total solo con items aprobados (no rechazados)
      const approvedServices = workOrder.services.filter(s => !rejectedServiceIds.includes(s.id));
      const approvedParts = workOrder.parts.filter(p => !rejectedPartIds.includes(p.id));
      
      const servicesTotal = approvedServices.reduce((sum, s) => sum + s.price, 0);
      const partsTotal = approvedParts.reduce((sum, p) => sum + p.price, 0);
      newTotalAmount = servicesTotal + partsTotal;
      
      // Mantenemos todos los items pero guardamos cuáles fueron rechazados
    }

    // Actualizar en Firebase
    const currentQuote = workOrder.quote || {};
    const quoteUpdate = {
      ...currentQuote,
      status: action.payload.response,
      respondedAt: new Date(),
      clientResponse: action.payload.notes
    };

    // Solo agregar rejectedItems si no es undefined
    if (action.payload.rejectedItems !== undefined) {
      quoteUpdate.rejectedItems = action.payload.rejectedItems;
    }

    const updateData = {
      totalAmount: newTotalAmount,
      quote: quoteUpdate
    };
    
    updateWorkOrder(action.payload.workOrderId, updateData);

    return {
      ...state,
      workOrders: state.workOrders.map(wo => 
        wo.id === action.payload.workOrderId 
          ? { 
              ...wo, 
              totalAmount: newTotalAmount,
              quote: quoteUpdate
            }
          : wo
      )
    };
    
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: Omit<AppState, 'currentUser'>;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    let isMounted = true;
    dispatch({ type: 'SET_LOADING', payload: true });

    const fetchData = async () => {
      try {
        const [clientsData, usersData, bicyclesData, servicesData, partsData] = await Promise.all([
          getClients(),
          getUsers(),
          getBicycles(),
          getServices(),
          getParts()
        ]);

        if (isMounted) {
          dispatch({ type: 'SET_CLIENTS', payload: clientsData });
          dispatch({ type: 'SET_USERS', payload: usersData });
          dispatch({ type: 'SET_BICYCLES', payload: bicyclesData });
          console.log("Bicicletas cargadas:", bicyclesData.length);
        }

        // --- Carga de Fichas de Trabajo ---
        const workOrdersSnapshot = await getDocs(collection(db, "workorders"));
        const workOrdersData = workOrdersSnapshot.docs.map(doc => {
          const data = doc.data();
          
          // Convertir fechas de servicios y piezas
          const services = (data.services || []).map((s: any) => ({
            ...s,
            createdAt: s.createdAt?.toDate ? s.createdAt.toDate() : new Date()
          }));
          
          const parts = (data.parts || []).map((p: any) => ({
            ...p,
            createdAt: p.createdAt?.toDate ? p.createdAt.toDate() : new Date()
          }));

          const originalServices = (data.originalServices || []).map((s: any) => ({
            ...s,
            createdAt: s.createdAt?.toDate ? s.createdAt.toDate() : new Date()
          }));
          
          const originalParts = (data.originalParts || []).map((p: any) => ({
            ...p,
            createdAt: p.createdAt?.toDate ? p.createdAt.toDate() : new Date()
          }));
          
          // Convertir fechas del quote si existe
          const quote = data.quote ? {
            ...data.quote,
            sentAt: data.quote.sentAt?.toDate ? data.quote.sentAt.toDate() : data.quote.sentAt,
            respondedAt: data.quote.respondedAt?.toDate ? data.quote.respondedAt.toDate() : data.quote.respondedAt
          } : undefined;

          return {
            id: doc.id,
            ...data,
            services,
            parts,
            originalServices,
            originalParts,
            quote,
            client: clientsData.find(c => c.id === data.clientId),
            bicycle: bicyclesData.find(b => b.id === data.bicycleId),
            mechanic: data.mechanicId ? usersData.find(u => u.id === data.mechanicId) : null,
            estimatedDeliveryDate: data.estimatedDeliveryDate?.toDate(),
            startedAt: data.startedAt?.toDate(),
            completedAt: data.completedAt?.toDate(),
            deliveredAt: data.deliveredAt?.toDate(),
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date()
          } as WorkOrder;
        });
        if (isMounted) {
          dispatch({ type: 'SET_WORK_ORDERS', payload: workOrdersData });
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error("Error crítico al cargar datos desde Firebase: ", error);
        if(isMounted) dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
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