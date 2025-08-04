import { collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from '../firebase/config';
import { Client } from './Client.js';
import { Bicycle } from './Bicycle.js';
import { User } from './User.js';

const workOrdersCollection = collection(db, "workorders");

export class WorkOrder {
    constructor({ 
        id, clientId, bicycleId, mechanicId, status, description, mechanicNotes,
        totalAmount, parts, services, createdAt, updatedAt, startedAt, completedAt, 
        estimatedDeliveryDate, client, bicycle, mechanic 
    }) {

        this.id = id;
        this.clientId = clientId;
        this.bicycleId = bicycleId;
        this.mechanicId = mechanicId;
        this.status = status;
        this.description = description;
        this.mechanicNotes = mechanicNotes;
        this.totalAmount = totalAmount;
        this.parts = parts || [];
        this.services = services || [];
        
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.startedAt = startedAt;
        this.completedAt = completedAt;
        this.estimatedDeliveryDate = estimatedDeliveryDate;

        this.client = client;
        this.bicycle = bicycle;
        this.mechanic = mechanic;
    }

    static async create(workOrderData) {
        const dataToSave = {
            ...workOrderData,
            status: 'open',
            totalAmount: Number(workOrderData.totalAmount) || 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const docRef = await addDoc(workOrdersCollection, dataToSave);
        return new WorkOrder({ id: docRef.id, ...dataToSave });
    }

    /**
     * Obtiene una ficha de trabajo por su ID y la devuelve con los datos
     * del cliente, bicicleta y mecánico ya cargados.
     * @param {string} workOrderId - El ID de la ficha de trabajo.
     * @returns {Promise<WorkOrder|null>} La instancia completa de la ficha.
     */
    static async getById(workOrderId) {
        const workOrderDoc = doc(db, "workorders", workOrderId);
        const snapshot = await getDoc(workOrderDoc);

        if (!snapshot.exists()) {
            return null;
        }

        const data = snapshot.data();
        
        const client = data.clientId ? await Client.getById(data.clientId) : null;
        const bicycle = data.bicycleId ? await Bicycle.getById(data.bicycleId) : null;
        const mechanic = data.mechanicId ? await User.getById(data.mechanicId) : null;

        return new WorkOrder({
            id: snapshot.id,
            ...data,
            client,
            bicycle,
            mechanic,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
            estimatedDeliveryDate: data.estimatedDeliveryDate?.toDate(),
            startedAt: data.startedAt?.toDate(),
            completedAt: data.completedAt?.toDate(),
        });
    }

    /**
     * Actualiza los datos de la ficha. Formatea los repuestos y servicios
     * para guardarlos correctamente en Firestore.
     * @param {object} newData - Los nuevos datos para la ficha.
     */
    async update(newData) {
        const workOrderDoc = doc(db, "workorders", this.id);
        const dataToUpdate = { ...newData };

        if (dataToUpdate.services) {
            dataToUpdate.services = dataToUpdate.services.map(s => ({
                serviceId: s.serviceId, name: s.name, price: s.price, quantity: s.quantity
            }));
        }
        if (dataToUpdate.parts) {
            dataToUpdate.parts = dataToUpdate.parts.map(p => ({
                partId: p.partId, name: p.name, price: p.price, quantity: p.quantity
            }));
        }

        dataToUpdate.updatedAt = new Date();
        await updateDoc(workOrderDoc, dataToUpdate);
        Object.assign(this, newData, { updatedAt: dataToUpdate.updatedAt });
    }

    /**
     * Inicia el trabajo en la ficha, asignando un mecánico y cambiando el estado.
     * @param {string} mechanicId - El UID del mecánico que inicia el trabajo.
     */
    async startWork(mechanicId) {
        const workOrderDoc = doc(db, "workorders", this.id);
        const updateData = {
            status: 'in_progress',
            startedAt: new Date(),
            mechanicId: mechanicId
        };
        await updateDoc(workOrderDoc, updateData);
        Object.assign(this, updateData);
        this.mechanic = await User.getById(mechanicId);
    }
    
    /**
     * Completa el trabajo en la ficha, cambiando el estado.
     */
    async completeWork() {
        const workOrderDoc = doc(db, "workorders", this.id);
        const updateData = {
            status: 'ready_for_delivery',
            completedAt: new Date()
        };
        await updateDoc(workOrderDoc, updateData);
        Object.assign(this, updateData);
    }

    async remove() {
        const workOrderDoc = doc(db, "workorders", this.id);
        await deleteDoc(workOrderDoc);
    }
}