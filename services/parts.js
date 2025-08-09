import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, runTransaction } from "firebase/firestore";
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
    const { id, ...dataToUpdate } = partData;
    await updateDoc(partDoc, dataToUpdate);
};

export const deletePart = async (partId) => {
    const partDoc = doc(db, 'parts', partId);
    await deleteDoc(partDoc);
};

export const updatePartStock = async (stockUpdates) => {
    try {
        await runTransaction(db, async (transaction) => {
            // ====================================================================
            // FASE 1: TODAS LAS LECTURAS PRIMERO
            // ====================================================================
            const partUpdates = [];
            
            for (const update of stockUpdates) {
                const partRef = doc(db, "parts", update.partId);
                const partDoc = await transaction.get(partRef);

                if (!partDoc.exists()) {
                    throw `La pieza con ID ${update.partId} no existe.`;
                }

                const currentStock = partDoc.data().stock || 0;
                const newStock = currentStock - update.quantityChange;

                if (newStock < 0) {
                    const partName = partDoc.data().name || 'desconocida';
                    throw `No hay suficiente stock para la pieza ${partName}. Stock actual: ${currentStock}, se necesitan: ${update.quantityChange}.`;
                }

                // Guardar datos para las escrituras
                partUpdates.push({
                    partRef,
                    newStock
                });
            }

            // ====================================================================
            // FASE 2: TODAS LAS ESCRITURAS DESPUÉS
            // ====================================================================
            for (const partUpdate of partUpdates) {
                transaction.update(partUpdate.partRef, { stock: partUpdate.newStock });
            }
        });
        console.log("Stock actualizado correctamente.");
    } catch (error) {
        console.error("Error al actualizar el stock en la transacción: ", error);
        throw error;
    }
};