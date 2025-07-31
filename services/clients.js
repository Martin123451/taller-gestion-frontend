import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where, writeBatch } from "firebase/firestore";
import { db } from '../firebase/config';

const clientsCollection = collection(db, "clients");

export const getClients = async () => {
    const querySnapshot = await getDocs(clientsCollection);
    const clients = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate()
        };
    });
    return clients;
};

export const createClient = async (clientData) => {
    const dataWithTimestamp = { ...clientData, createdAt: new Date(), updatedAt: new Date() };
    const docRef = await addDoc(clientsCollection, dataWithTimestamp);
    return { id: docRef.id, ...dataWithTimestamp };
};

export const updateClient = async (clientId, clientData) => {
    const clientDoc = doc(db, "clients", clientId);
    const dataToUpdate = { ...clientData, updatedAt: new Date() };
    await updateDoc(clientDoc, dataToUpdate);
};

export const deleteClient = async (clientId) => {
    const batch = writeBatch(db);

    // 1. Encontrar y borrar todas las bicicletas asociadas al cliente
    const bicyclesQuery = query(collection(db, "bicycles"), where("clientId", "==", clientId));
    const bicyclesSnapshot = await getDocs(bicyclesQuery);
    bicyclesSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
    });

    // 2. Encontrar y borrar todas las fichas de trabajo asociadas al cliente
    const workOrdersQuery = query(collection(db, "workOrders"), where("clientId", "==", clientId));
    const workOrdersSnapshot = await getDocs(workOrdersQuery);
    workOrdersSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
    });

    // 3. Borrar el cliente mismo
    const clientDoc = doc(db, "clients", clientId);
    batch.delete(clientDoc);

    // 4. Ejecutar todas las operaciones de borrado a la vez
    await batch.commit();
};