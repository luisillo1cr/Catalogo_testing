import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCMipiGsyVquOMthAWS2XzoeiOWdVeDWYw",
  authDomain: "catalogoventas-dc456.firebaseapp.com",
  projectId: "catalogoventas-dc456",
  storageBucket: "catalogoventas-dc456.firebasestorage.app",
  messagingSenderId: "706284239612",
  appId: "1:706284239612:web:9bf3c4305d7717bc59f579"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);