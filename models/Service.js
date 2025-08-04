import { collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from '../firebase/config';

const servicesCollection = collection(db, 'services');

export class Service {
    constructor({ id, name, price, createdAt, updatedAt }) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    /**
     * Crea un nuevo servicio en la base de datos.
     * @param {object} serviceData - Datos del servicio (name, price).
     * @returns {Promise<Service>} Una instancia del nuevo servicio.
     */
    static async create(serviceData) {
        const dataToSave = {
            ...serviceData,
            price: Number(serviceData.price) || 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const docRef = await addDoc(servicesCollection, dataToSave);
        return new Service({ id: docRef.id, ...dataToSave });
    }

    /**
     * Obtiene todos los servicios de la base de datos.
     * @returns {Promise<Service[]>} Un array con todas las instancias de Service.
     */
    static async getAll() {
        const snapshot = await getDocs(servicesCollection);
        return snapshot.docs.map(doc => Service.fromFirestore(doc));
    }

    /**
     * Obtiene un servicio por su ID.
     * @param {string} serviceId - El ID del documento del servicio.
     * @returns {Promise<Service|null>} Una instancia del servicio o null si no se encuentra.
     */
    static async getById(serviceId) {
        const serviceDoc = doc(db, 'services', serviceId);
        const snapshot = await getDoc(serviceDoc);
        if (!snapshot.exists()) {
            return null;
        }
        return Service.fromFirestore(snapshot);
    }
    
    /**
     * Elimina un servicio de la base de datos.
     * @param {string} serviceId - El ID del servicio a eliminar.
     */
    static async delete(serviceId) {
        const serviceDoc = doc(db, 'services', serviceId);
        await deleteDoc(serviceDoc);
    }

    /**
     * Actualiza los datos de este servicio.
     * @param {object} newData - Los nuevos datos para el servicio.
     */
    async update(newData) {
        const serviceDoc = doc(db, 'services', this.id);
        const dataToUpdate = { ...newData, updatedAt: new Date() };
        await updateDoc(serviceDoc, dataToUpdate);
        Object.assign(this, newData, { updatedAt: dataToUpdate.updatedAt });
    }

    /**
     * Elimina este servicio específico de la base de datos.
     */
    async remove() {
        await Service.delete(this.id);
    }

    // Helper para convertir un documento de Firestore a una instancia de Service
    static fromFirestore(docSnapshot) {
        const data = docSnapshot.data();
        return new Service({
            id: docSnapshot.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate()
        });
    }
}