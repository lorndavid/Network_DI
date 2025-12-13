import firebase from "firebase/compat/app";
import "firebase/compat/database";
import { Cabin } from "../types";

const firebaseConfig = {
  apiKey: "AIzaSyATNBHU58oq6TIFZ3V4VrtaN0z9MfnWJwQ",
  authDomain: "internet-manegement-di.firebaseapp.com",
  projectId: "internet-manegement-di",
  storageBucket: "internet-manegement-di.firebasestorage.app",
  messagingSenderId: "811368710372",
  appId: "1:811368710372:web:cea6c0f90facb83a702cf1",
  measurementId: "G-R5J0V7N6VD"
};

// Initialize Firebase (check for existing apps to prevent re-initialization)
const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();
const db = app.database();

// Refs
const cabinsRef = db.ref('cabins');

export const subscribeToCabins = (callback: (cabins: Cabin[]) => void) => {
  const handler = (snapshot: firebase.database.DataSnapshot) => {
    const data = snapshot.val();
    const cabinsList: Cabin[] = [];
    if (data) {
      Object.keys(data).forEach(key => {
        cabinsList.push({
          ...data[key],
          id: key
        });
      });
    }
    callback(cabinsList);
  };
  
  cabinsRef.on('value', handler);
  // Return unsubscribe function
  return () => cabinsRef.off('value', handler);
};

export const createCabin = async (cabin: Omit<Cabin, 'id'>) => {
  const newCabinRef = cabinsRef.push();
  await newCabinRef.set({ ...cabin, id: newCabinRef.key });
  return newCabinRef.key;
};

export const updateCabin = async (id: string, updates: Partial<Cabin>) => {
  const cabinRef = db.ref(`cabins/${id}`);
  await cabinRef.update(updates);
};

export const deleteCabin = async (id: string) => {
  const cabinRef = db.ref(`cabins/${id}`);
  await cabinRef.remove();
};

export { db };