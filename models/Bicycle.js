import { collection, getDocs, getDoc, addDoc, doc, updateDoc, deleteDoc, query, where, writeBatch } from "firebase/firestore";
import { db } from '../firebase/config';

const bicyclesCollection = collection(db, "bicycles");

export class Bicycle {
    constructor({ id, clientId, brand, model, type, color, serialNumber, year, notes, createdAt, updatedAt }) {
        this.id = id;
        this.clientId = clientId;
        this.brand = brand;
        this.model = model;
        this.type = type;
        this.color = color;
        this.serialNumber = serialNumber;
        this.year = year;
        this.notes = notes;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    /**
     * Crea una nueva bicicleta en la base de datos.
     * @param {object} bicycleData - Datos de la bicicleta (brand, model, clientId, etc.).
     * @returns {Bicycle} Una instancia de la nueva bicicleta.
     */
    static async create(bicycleData) {
        if (!bicycleData.clientId) {
            throw new Error("El campo 'clientId' es requerido para crear una bicicleta.");
        }
        const dataWithTimestamp = {
            ...bicycleData,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const docRef = await addDoc(bicyclesCollection, dataWithTimestamp);
        return new Bicycle({ id: docRef.id, ...dataWithTimestamp });
    }
    
    /**
     * Obtiene todas las bicicletas de un cliente específico.
     * @param {string} clientId - El ID del cliente.
     * @returns {Promise<Bicycle[]>} Un array con las bicicletas del cliente.
     */
    static async getByClientId(clientId) {
        const q = query(bicyclesCollection, where("clientId", "==", clientId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => Bicycle.fromFirestore(doc));
    }

    /**
     * Obtiene una bicicleta por su ID.
     * @param {string} bicycleId - El ID del documento de la bicicleta.
     * @returns {Promise<Bicycle|null>} Una instancia de la bicicleta o null si no se encuentra.
     */
    static async getById(bicycleId) {
        const bicycleDoc = doc(db, "bicycles", bicycleId);
        const snapshot = await getDoc(bicycleDoc);
        if (!snapshot.exists()) {
            return null;
        }
        return Bicycle.fromFirestore(snapshot);
    }

    /**
     * Elimina una bicicleta y todas sus fichas de trabajo asociadas.
     * @param {string} bicycleId - El ID de la bicicleta a eliminar.
     */
    static async delete(bicycleId) {
        const batch = writeBatch(db);

        const workOrdersQuery = query(collection(db, "workOrders"), where("bicycleId", "==", bicycleId));
        const workOrdersSnapshot = await getDocs(workOrdersQuery);
        workOrdersSnapshot.forEach(doc => batch.delete(doc.ref));

        const bicycleDoc = doc(db, "bicycles", bicycleId);
        batch.delete(bicycleDoc);

        await batch.commit();
    }
    
   
    /**
     * Actualiza los datos de esta bicicleta en la base de datos.
     * @param {object} newData - Los nuevos datos para la bicicleta.
     */
    async update(newData) {
        const bicycleDoc = doc(db, "bicycles", this.id);
        const dataToUpdate = { ...newData, updatedAt: new Date() };
        await updateDoc(bicycleDoc, dataToUpdate);
        Object.assign(this, newData, { updatedAt: dataToUpdate.updatedAt });
    }

    /**
     * Elimina esta bicicleta específica de la base de datos.
     */
    async remove() {
        await Bicycle.delete(this.id);
    }
    
    // Helper para convertir un documento de Firestore a una instancia de Bicycle
    static fromFirestore(docSnapshot) {
        const data = docSnapshot.data();
        return new Bicycle({
            id: docSnapshot.id,
            ...data,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate()
        });
    }
}