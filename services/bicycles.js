import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where, writeBatch } from "firebase/firestore";
import { db } from '../firebase/config';

const bicyclesCollection = collection(db, "bicycles");

export const getBicycles = async () => {
    const querySnapshot = await getDocs(bicyclesCollection);
    const bicycles = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate()
        };
    });
    return bicycles;
};

export const createBicycle = async (bicycleData) => {
    const dataWithTimestamp = { ...bicycleData, createdAt: new Date(), updatedAt: new Date() };
    const docRef = await addDoc(bicyclesCollection, dataWithTimestamp);
    return { id: docRef.id, ...dataWithTimestamp };
};

export const updateBicycle = async (bicycleId, bicycleData) => {
    const bicycleDoc = doc(db, "bicycles", bicycleId);
    const dataToUpdate = { ...bicycleData, updatedAt: new Date() };
    await updateDoc(bicycleDoc, dataToUpdate);
};

export const deleteBicycle = async (bicycleId) => {
    const batch = writeBatch(db);

    // 1. Encontrar y borrar todas las fichas de trabajo asociadas a la bicicleta
    const workOrdersQuery = query(collection(db, "workOrders"), where("bicycleId", "==", bicycleId));
    const workOrdersSnapshot = await getDocs(workOrdersQuery);
    workOrdersSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
    });

    // 2. Borrar la bicicleta misma
    const bicycleDoc = doc(db, "bicycles", bicycleId);
    batch.delete(bicycleDoc);

    // 3. Ejecutar todas las operaciones de borrado a la vez
    await batch.commit();
};