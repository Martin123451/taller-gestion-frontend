import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from '../firebase/config';

// CORRECCIÓN 1: Apuntar a la colección correcta
const workOrdersCollection = collection(db, "workorders");

export const getWorkOrders = async (clientsData, bicyclesData) => {
    const querySnapshot = await getDocs(workOrdersCollection);
    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        const client = clientsData.find(c => c.id === data.clientId);
        const bicycle = bicyclesData.find(b => b.id === data.bicycleId);
        return { 
            id: doc.id, 
            ...data,
            client, 
            bicycle,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
            estimatedDeliveryDate: data.estimatedDeliveryDate?.toDate(),
            startedAt: data.startedAt?.toDate(),
            completedAt: data.completedAt?.toDate(),
            deliveredAt: data.deliveredAt?.toDate(),
        };
    });
};

export const createWorkOrder = async (workOrderData, client, bicycle) => {
    const dataToSave = { ...workOrderData };
    delete dataToSave.client;
    delete dataToSave.bicycle;
    const docRef = await addDoc(workOrdersCollection, dataToSave);
    return { id: docRef.id, ...workOrderData, client, bicycle };
};

export const startWorkOnOrder = async (workOrderId, mechanicId) => {
    const workOrderDoc = doc(db, "workorders", workOrderId);
    await updateDoc(workOrderDoc, {
        status: 'in_progress',
        startedAt: new Date(),
        mechanicId: mechanicId
    });
};

export const completeWorkOnOrder = async (workOrderId) => {
    const workOrderDoc = doc(db, "workorders", workOrderId);
    await updateDoc(workOrderDoc, {
        status: 'ready_for_delivery',
        completedAt: new Date()
    });
};

// CORRECCIÓN 2: Guardar los datos en el formato anidado correcto
export const updateWorkOrder = async (workOrderId, workOrderData) => {
    const workOrderDoc = doc(db, "workorders", workOrderId);

    const dataToUpdate = { ...workOrderData };
    
    // Nos aseguramos de que la estructura anidada sea la correcta para Firestore
    if (dataToUpdate.services) {
        dataToUpdate.services = dataToUpdate.services.map(s => ({
            id: s.id,
            serviceId: s.service.id,
            service: { id: s.service.id, name: s.service.name, price: s.service.price },
            quantity: s.quantity,
            price: s.price,
            createdAt: s.createdAt || new Date()
        }));
    }

    if (dataToUpdate.parts) {
        dataToUpdate.parts = dataToUpdate.parts.map(p => ({
            id: p.id,
            partId: p.part.id,
            part: { id: p.part.id, name: p.part.name, price: p.part.price, stock: p.part.stock },
            quantity: p.quantity,
            price: p.price,
            createdAt: p.createdAt || new Date()
        }));
    }

    // ====================================================================
    // FIX: Preservar originalServices, originalParts y originalAmount
    // ====================================================================
    if (dataToUpdate.originalServices) {
        dataToUpdate.originalServices = dataToUpdate.originalServices.map(s => ({
            id: s.id,
            serviceId: s.service.id,
            service: { id: s.service.id, name: s.service.name, price: s.service.price },
            quantity: s.quantity,
            price: s.price,
            createdAt: s.createdAt || new Date()
        }));
    }

    if (dataToUpdate.originalParts) {
        dataToUpdate.originalParts = dataToUpdate.originalParts.map(p => ({
            id: p.id,
            partId: p.part.id,
            part: { id: p.part.id, name: p.part.name, price: p.part.price, stock: p.part.stock },
            quantity: p.quantity,
            price: p.price,
            createdAt: p.createdAt || new Date()
        }));
    }
    // ====================================================================

    delete dataToUpdate.client;
    delete dataToUpdate.bicycle;
    dataToUpdate.updatedAt = new Date();

    await updateDoc(workOrderDoc, dataToUpdate);
};

export const deleteWorkOrder = async (workOrderId) => {
    const workOrderDoc = doc(db, "workorders", workOrderId);
    await deleteDoc(workOrderDoc);
};