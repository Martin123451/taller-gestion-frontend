import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from '../firebase/config';

const partsCollection = collection(db, 'parts');

export const getParts = async () => {
    const querySnapshot = await getDocs(partsCollection);
    const parts = [];
    querySnapshot.forEach((doc) => {
        parts.push({ id: doc.id, ...doc.data() });
    });
    return parts;
};

export const createPart = async (partData) => {
    const { id, ...dataToSave } = partData;
    const dataWithNumericStock = {
        ...dataToSave,
        stock: Number(dataToSave.stock) || 0
    };
    const docRef = await addDoc(partsCollection, dataWithNumericStock);
    return { id: docRef.id, ...dataWithNumericStock };
};

export const updatePart = async (partId, partData) => {
    const partDoc = doc(db, 'parts', partId);
    const dataToUpdate = { ...partData, stock: Number(partData.stock) || 0 };
    await updateDoc(partDoc, dataToUpdate);
};

export const deletePart = async (partId) => {
    const partDoc = doc(db, 'parts', partId);
    await deleteDoc(partDoc);
};