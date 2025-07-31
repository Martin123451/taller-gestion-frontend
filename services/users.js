import { collection, getDocs } from "firebase/firestore";
import { db } from '../firebase/config';

// Esta función pide a Firebase la lista completa de usuarios
export const getUsers = async () => {
    const querySnapshot = await getDocs(collection(db, "users"));
    const users = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            // Si tienes fechas en tus usuarios, conviértelas aquí
            // createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
        };
    });
    return users;
};