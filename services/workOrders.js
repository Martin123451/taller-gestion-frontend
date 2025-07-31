import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from '../firebase/config';

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
        };
    });
};

export const createWorkOrder = async (workOrderData, client, bicycle) => {
    const dataToSave = {
      ...workOrderData,
      client: null,
      bicycle: null,
    };
    delete dataToSave.client;
    delete dataToSave.bicycle;
    const docRef = await addDoc(workOrdersCollection, dataToSave);
    return { id: docRef.id, ...workOrderData, client, bicycle };
};

export const updateWorkOrder = async (workOrderId, workOrderData) => {
    const workOrderDoc = doc(db, "workorders", workOrderId);
    const dataToUpdate = { ...workOrderData, updatedAt: new Date() };
    // Evitamos guardar los objetos anidados de cliente y bicicleta en la BD
    delete dataToUpdate.client;
    delete dataToUpdate.bicycle;
    await updateDoc(workOrderDoc, dataToUpdate);
};

export const deleteWorkOrder = async (workOrderId) => {
    const workOrderDoc = doc(db, "workorders", workOrderId);
    await deleteDoc(workOrderDoc);
};