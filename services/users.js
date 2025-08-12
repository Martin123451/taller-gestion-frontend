import { collection, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from '../firebase/config';

const usersCollection = collection(db, "users");
const functionsUrl = "https://us-central1-taller-gestion-backend.cloudfunctions.net";

const callFunction = async (functionName, data) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuario no autenticado.");

  const token = await user.getIdToken();

  const response = await fetch(`${functionsUrl}/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ data: data }),
  });

  const result = await response.json();

  if (!response.ok) {
    const errorMessage = result.error?.message || 'Ocurrió un error en el servidor.';
    throw new Error(errorMessage);
  }

  return result.data;
};

export const getUsers = async () => {
  const querySnapshot = await getDocs(usersCollection);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getUserById = async (uid) => {
  const userDoc = await getDoc(doc(db, "users", uid));
  if (userDoc.exists()) {
    return { id: userDoc.id, ...userDoc.data() };
  }
  return null;
};

export const createUser = async (userData) => {
  return callFunction('createUser', userData);
};

export const updateUser = async (uid, dataToUpdate) => {
  const userDoc = doc(db, "users", uid);
  await updateDoc(userDoc, dataToUpdate);
};

export const deleteUser = async (uid) => {
  return callFunction('deleteUser', { uid });
};

export const updateUserPassword = async (uid, password) => {
  return callFunction('updateUserPassword', { uid, password });
};