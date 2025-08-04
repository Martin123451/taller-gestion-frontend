import { collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, runTransaction } from "firebase/firestore";
import { db } from '../firebase/config';

const partsCollection = collection(db, 'parts');

export class Part {
    constructor({ id, name, brand, price, stock, createdAt, updatedAt }) {
        this.id = id;
        this.name = name;
        this.brand = brand;
        this.price = price;
        this.stock = stock;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    /**
     * Crea un nuevo repuesto en la base de datos.
     * @param {object} partData - Datos del repuesto (name, brand, price, stock).
     * @returns {Promise<Part>} Una instancia del nuevo repuesto.
     */
    static async create(partData) {
        const dataToSave = {
            ...partData,
            price: Number(partData.price) || 0,
            stock: Number(partData.stock) || 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const docRef = await addDoc(partsCollection, dataToSave);
        return new Part({ id: docRef.id, ...dataToSave });
    }

    /**
     * Obtiene todos los repuestos de la base de datos.
     * @returns {Promise<Part[]>} Un array con todas las instancias de Part.
     */
    static async getAll() {
        const snapshot = await getDocs(partsCollection);
        return snapshot.docs.map(doc => Part.fromFirestore(doc));
    }

    /**
     * Obtiene un repuesto por su ID.
     * @param {string} partId - El ID del documento del repuesto.
     * @returns {Promise<Part|null>} Una instancia del repuesto o null si no se encuentra.
     */
    static async getById(partId) {
        const partDoc = doc(db, 'parts', partId);
        const snapshot = await getDoc(partDoc);
        if (!snapshot.exists()) {
            return null;
        }
        return Part.fromFirestore(snapshot);
    }

    /**
     * Elimina un repuesto de la base de datos.
     * @param {string} partId - El ID del repuesto a eliminar.
     */
    static async delete(partId) {
        const partDoc = doc(db, 'parts', partId);
        await deleteDoc(partDoc);
    }
    
    /**
     * Actualiza el stock de varios repuestos dentro de una transacción segura.
     * Ideal para descontar stock al finalizar una ficha de trabajo.
     * @param {Array<{partId: string, quantityChange: number}>} stockUpdates - Un array de objetos con el ID del repuesto y la cantidad a descontar.
     */
    static async updateStockTransaction(stockUpdates) {
        try {
            await runTransaction(db, async (transaction) => {
                const partsToUpdate = [];

                for (const update of stockUpdates) {
                    const partRef = doc(db, "parts", update.partId);
                    const partDoc = await transaction.get(partRef);

                    if (!partDoc.exists()) {
                        throw `El repuesto con ID ${update.partId} no existe.`;
                    }
                    const currentStock = partDoc.data().stock;
                    const newStock = currentStock - update.quantityChange;

                    if (newStock < 0) {
                        throw `Stock insuficiente para ${partDoc.data().name}. Stock actual: ${currentStock}.`;
                    }
                    partsToUpdate.push({ ref: partRef, newStock });
                }

                for (const part of partsToUpdate) {
                    transaction.update(part.ref, { stock: part.newStock, updatedAt: new Date() });
                }
            });
        } catch (error) {
            console.error("Error en la transacción de stock: ", error);
            throw error;
        }
    }

    /**
     * Actualiza los datos de este repuesto (nombre, precio, etc.). No usar para stock.
     * @param {object} newData - Los nuevos datos para el repuesto.
     */
    async update(newData) {
        const partDoc = doc(db, 'parts', this.id);
        const dataToUpdate = { ...newData, updatedAt: new Date() };
        await updateDoc(partDoc, dataToUpdate);
        Object.assign(this, newData, { updatedAt: dataToUpdate.updatedAt });
    }

    /**
     * Elimina este repuesto específico de la base de datos.
     */
    async remove() {
        await Part.delete(this.id);
    }
    
    // Helper para convertir un documento de Firestore a una instancia de Part
    static fromFirestore(docSnapshot) {
        const data = docSnapshot.data();
        const partData = {
            id: docSnapshot.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate()
        };
        return new Part(partData);
    }
}