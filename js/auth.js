import { auth, provider, db } from './firebase.js';
import {
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js';
import { doc, setDoc, getDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js';

// Google
export async function loginWithGoogle() {
  const { user } = await signInWithPopup(auth, provider);
  await setDoc(doc(db, 'users', user.uid), {
    name:      user.displayName,
    email:     user.email,
    cart:      [],
    createdAt: serverTimestamp()
  }, { merge: true });
  return user;
}

// Email/password
export async function loginWithEmail(email, password, isNew) {
  const cred = isNew
    ? await createUserWithEmailAndPassword(auth, email, password)
    : await signInWithEmailAndPassword(auth, email, password);
  const user = cred.user;
  await setDoc(doc(db, 'users', user.uid), {
    name:      user.displayName || null,
    email:     user.email,
    cart:      [],
    createdAt: serverTimestamp()
  }, { merge: true });
  return user;
}

export function logout() {
  return signOut(auth);
}

export function onAuthChange(callback) {
  
  return onAuthStateChanged(auth, callback);
}

// Comprueba si el usuario es admin
export async function isAdmin(uid) {
  const snap = await getDoc(doc(db, 'admins', uid));
  return snap.exists();
}
