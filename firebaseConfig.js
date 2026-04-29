import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyC_3VzyOdUn49W9iDOsEdi3PgyACCvnUBY",
  authDomain: "emergency-alert-565d8.firebaseapp.com",
  databaseURL: "https://emergency-alert-565d8-default-rtdb.firebaseio.com",
  projectId: "emergency-alert-565d8",
  storageBucket: "emergency-alert-565d8.firebasestorage.app",
  messagingSenderId: "552349833983",
  appId: "1:552349833983:web:238681033ebb70fa830aca"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ THIS is what you need
export const db = getDatabase(app);