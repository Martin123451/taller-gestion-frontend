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
    const dataWithNumericFields = {
        ...dataToSave,
        stock: Number(dataToSave.stock) || 0,
        price: Number(dataToSave.price) || 0,
        costPrice: dataToSave.costPrice ? Number(dataToSave.costPrice) : undefined
    };
    const docRef = await addDoc(partsCollection, dataWithNumericFields);
    return { id: docRef.id, ...dataWithNumericFields };
};

export const updatePart = async (partId, partData) => {
    const partDoc = doc(db, 'parts', partId);
    const { id, ...dataToUpdate } = partData;
    
    // Asegurar que los campos numéricos sean números
    const processedData = {
        ...dataToUpdate,
        ...(dataToUpdate.price !== undefined && { price: Number(dataToUpdate.price) || 0 }),
        ...(dataToUpdate.stock !== undefined && { stock: Number(dataToUpdate.stock) || 0 }),
        ...(dataToUpdate.costPrice !== undefined && { costPrice: dataToUpdate.costPrice ? Number(dataToUpdate.costPrice) : undefined })
    };
    
    await updateDoc(partDoc, processedData);
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

// Nueva función para reintegrar stock cuando items son parcialmente rechazados
export const reintegratePartStock = async (partId, quantityToReintegrate) => {
    try {
        await runTransaction(db, async (transaction) => {
            const partRef = doc(db, "parts", partId);
            const partDoc = await transaction.get(partRef);

            if (!partDoc.exists()) {
                throw `La pieza con ID ${partId} no existe.`;
            }

            const currentStock = partDoc.data().stock || 0;
            const newStock = currentStock + quantityToReintegrate;

            console.log(`[STOCK DEBUG] Reintegrar pieza ${partId}: stock actual ${currentStock} + cantidad ${quantityToReintegrate} = nuevo stock ${newStock}`);
            
            transaction.update(partRef, { stock: newStock });
        });
        console.log(`Stock reintegrado: ${quantityToReintegrate} unidades de pieza ${partId}`);
    } catch (error) {
        console.error("Error al reintegrar stock: ", error);
        throw error;
    }
};