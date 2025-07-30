import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from '../firebase/config';

const servicesCollection = collection(db, 'services');

export const getServices = async () => {
    const querySnapshot = await getDocs(servicesCollection);
    const services = [];
    querySnapshot.forEach((doc) => {
        services.push({ id: doc.id, ...doc.data() });
    });
    return services;
};

export const createService = async (serviceData) => {
    // Excluimos el ID temporal que le dimos en el frontend
    const { id, ...dataToSave } = serviceData;
    const docRef = await addDoc(servicesCollection, dataToSave);
    // Devolvemos el objeto completo con el nuevo ID de Firebase
    return { id: docRef.id, ...dataToSave };
};

export const updateService = async (serviceId, serviceData) => {
    const serviceDoc = doc(db, 'services', serviceId);
    await updateDoc(serviceDoc, serviceData);
};

export const deleteService = async (serviceId) => {
    const serviceDoc = doc(db, 'services', serviceId);
    await deleteDoc(serviceDoc);
};