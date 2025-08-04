import { collection, getDocs, getDoc, addDoc, doc, updateDoc, deleteDoc, query, where, writeBatch } from "firebase/firestore";
import { db } from '../firebase/config';

const clientsCollection = collection(db, "clients");

export class Client {
    constructor({ id, name, email, phone, address, createdAt, updatedAt }) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.address = address;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    /**
     * Crea un nuevo cliente en la base de datos.
     * @param {object} clientData - Datos del cliente (name, email, etc.).
     * @returns {Client} Una instancia del nuevo cliente.
     */
    static async create(clientData) {
        const dataWithTimestamp = {
            ...clientData,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const docRef = await addDoc(clientsCollection, dataWithTimestamp);
        return new Client({ id: docRef.id, ...dataWithTimestamp });
    }

    /**
     * Obtiene todos los clientes de la base de datos.
     * @returns {Promise<Client[]>} Un array con todas las instancias de Client.
     */
    static async getAll() {
        const snapshot = await getDocs(clientsCollection);
        return snapshot.docs.map(doc => Client.fromFirestore(doc));
    }

    /**
     * Obtiene un cliente por su ID.
     * @param {string} clientId - El ID del documento del cliente.
     * @returns {Promise<Client|null>} Una instancia del cliente o null si no se encuentra.
     */
    static async getById(clientId) {
        const clientDoc = doc(db, "clients", clientId);
        const snapshot = await getDoc(clientDoc);
        if (!snapshot.exists()) {
            return null;
        }
        return Client.fromFirestore(snapshot);
    }
    
    /**
     * Elimina un cliente y todos sus datos asociados (bicicletas, fichas de trabajo).
     * @param {string} clientId - El ID del cliente a eliminar.
     */
    static async delete(clientId) {
        const batch = writeBatch(db);

        const bicyclesQuery = query(collection(db, "bicycles"), where("clientId", "==", clientId));
        const bicyclesSnapshot = await getDocs(bicyclesQuery);
        bicyclesSnapshot.forEach(doc => batch.delete(doc.ref));

        const workOrdersQuery = query(collection(db, "workOrders"), where("clientId", "==", clientId));
        const workOrdersSnapshot = await getDocs(workOrdersQuery);
        workOrdersSnapshot.forEach(doc => batch.delete(doc.ref));

        const clientDoc = doc(db, "clients", clientId);
        batch.delete(clientDoc);

        await batch.commit();
    }

    /**
     * Actualiza los datos de este cliente en la base de datos.
     * @param {object} newData - Los nuevos datos para el cliente.
     */
    async update(newData) {
        const clientDoc = doc(db, "clients", this.id);
        const dataToUpdate = { ...newData, updatedAt: new Date() };
        await updateDoc(clientDoc, dataToUpdate);
        // Actualiza las propiedades de la instancia local
        for (const key in newData) {
            if (this.hasOwnProperty(key)) {
                this[key] = newData[key];
            }
        }
        this.updatedAt = dataToUpdate.updatedAt;
    }

    /**
     * Elimina este cliente específico de la base de datos.
     */
    async remove() {
        await Client.delete(this.id);
    }


    // Helper para convertir un documento de Firestore a una instancia de Client
    static fromFirestore(docSnapshot) {
        const data = docSnapshot.data();
        const clientData = {
            id: docSnapshot.id,
            name: data.name,
            email: data.email,
            phone: data.phone,
            address: data.address,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate()
        };
        return new Client(clientData);
    }
}