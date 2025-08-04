import { collection, getDocs, getDoc, setDoc, updateDoc, doc } from "firebase/firestore";
import { db } from '../firebase/config';

const usersCollection = collection(db, 'users');

export class User {
    constructor({ uid, displayName, email, role }) {
        this.uid = uid;
        this.displayName = displayName;
        this.email = email;
        this.role = role;
    }


    /**
     * Obtiene los datos de Firestore para todos los usuarios.
     * @returns {Promise<User[]>} Un array con todas las instancias de User.
     */
    static async getAll() {
        const snapshot = await getDocs(usersCollection);
        return snapshot.docs.map(doc => User.fromFirestore(doc));
    }

    /**
     * Obtiene los datos de Firestore para un usuario específico por su UID.
     * @param {string} uid - El UID de Firebase Authentication.
     * @returns {Promise<User|null>} Una instancia del usuario o null si no se encuentra.
     */
    static async getById(uid) {
        const userDoc = doc(db, 'users', uid);
        const snapshot = await getDoc(userDoc);
        if (!snapshot.exists()) {
            return null;
        }
        return User.fromFirestore(snapshot);
    }
    
    /**
     * Crea o actualiza el documento de un usuario en Firestore.
     * Ideal para usar después de un registro o inicio de sesión exitoso.
     * @param {string} uid - El UID del usuario de Firebase Authentication.
     * @param {object} data - Los datos a guardar (ej: { displayName, email, role }).
     */
    static async createOrUpdate(uid, data) {
        const userDoc = doc(db, 'users', uid);
        // setDoc con { merge: true } crea el documento si no existe, o lo actualiza si ya existe.
        await setDoc(userDoc, data, { merge: true });
    }
    
    /**
     * Actualiza los datos de este usuario en Firestore.
     * @param {object} newData - Los nuevos datos para el usuario (ej: { role: 'editor' }).
     */
    async update(newData) {
        const userDoc = doc(db, 'users', this.uid);
        await updateDoc(userDoc, newData);
        Object.assign(this, newData);
    }
    
    // Helper para convertir un documento de Firestore a una instancia de User    
    static fromFirestore(docSnapshot) {
        const data = docSnapshot.data();
        return new User({
            uid: docSnapshot.id,
            ...data
        });
    }
}