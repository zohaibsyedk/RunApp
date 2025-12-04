// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth'; 
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyABxeWXHx9KJVkpZvnTOHGTF_dWIxMkeyU",
  authDomain: "runapp-472401.firebaseapp.com",
  projectId: "runapp-472401",
  storageBucket: "runapp-472401.firebasestorage.app",
  messagingSenderId: "179019793982",
  appId: "1:179019793982:web:ae103b7eefe1d169d8336f"
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export { auth };
export const db = getFirestore(app);