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

export const updatePart = async (stockUpdates) => {
    try {
        await runTransaction(db, async (transaction) => {
            const partsToUpdate = [];

            // 1. FASE DE LECTURA: Leemos el stock de todas las piezas de forma secuencial.
            for (const update of stockUpdates) {
                const partRef = doc(db, "parts", update.partId);
                const partDoc = await transaction.get(partRef);

                if (!partDoc.exists()) {
                    throw `La pieza con ID ${update.partId} no existe.`;
                }

                const currentStock = partDoc.data().stock || 0;
                const newStock = currentStock - update.quantityChange;

                if (newStock < 0) {
                    throw `No hay suficiente stock para la pieza ${partDoc.data().name}. Stock actual: ${currentStock}.`;
                }

                // Guardamos la información necesaria para la fase de escritura.
                partsToUpdate.push({ ref: partRef, newStock: newStock });
            }

            // 2. FASE DE ESCRITURA: Escribimos todos los cambios después de haber leído todo.
            for (const part of partsToUpdate) {
                transaction.update(part.ref, { stock: part.newStock });
            }
        });
        console.log("Stock actualizado correctamente en la transacción.");
    } catch (error) {
        console.error("Error al actualizar el stock en la transacción: ", error);
        throw error;
    }
};

export const deletePart = async (partId) => {
    const partDoc = doc(db, 'parts', partId);
    await deleteDoc(partDoc);
};

export const updatePartStock = async (stockUpdates) => {
    try {
        await runTransaction(db, async (transaction) => {
            for (const update of stockUpdates) {
                const partRef = doc(db, "parts", update.partId);
                const partDoc = await transaction.get(partRef);

                if (!partDoc.exists()) {
                    throw `La pieza con ID ${update.partId} no existe.`;
                }

                const currentStock = partDoc.data().stock || 0;
                const newStock = currentStock - update.quantityChange;

                if (newStock < 0) {
                    throw `No hay suficiente stock para la pieza ${partDoc.data().name}. Stock actual: ${currentStock}.`;
                }

                transaction.update(partRef, { stock: newStock });
            }
        });
        console.log("Stock actualizado correctamente.");
    } catch (error) {
        console.error("Error al actualizar el stock en la transacción: ", error);
        // Opcional: Re-lanzar el error para que el frontend pueda manejarlo
        throw error;
    }
};