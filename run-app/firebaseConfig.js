// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyABxeWXHx9KJVkpZvnTOHGTF_dWIxMkeyU",
  authDomain: "runapp-472401.firebaseapp.com",
  projectId: "runapp-472401",
  storageBucket: "runapp-472401.firebasestorage.app",
  messagingSenderId: "179019793982",
  appId: "1:179019793982:web:ae103b7eefe1d169d8336f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);