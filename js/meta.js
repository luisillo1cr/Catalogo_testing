// js/services/meta.js
import { db } from './firebase.js';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js';

// --- Categorías ---
export async function fetchCategories() {
  const snap = await getDocs(collection(db, 'categories'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export function addCategory(name) {
  return addDoc(collection(db, 'categories'), {
    name: name.trim(),
    createdAt: serverTimestamp()
  });
}

export function deleteCategory(id) {
  return deleteDoc(doc(db, 'categories', id));
}

// --- Tags ---
export async function fetchTags() {
  const snap = await getDocs(collection(db, 'tags'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export function addTag(name) {
  return addDoc(collection(db, 'tags'), {
    name: name.trim(),
    createdAt: serverTimestamp()
  });
}

export function deleteTag(id) {
  return deleteDoc(doc(db, 'tags', id));
}

export async function fetchSizes() {
  const snap = await getDocs(collection(db, 'sizes'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export function addSize(name) {
  return addDoc(collection(db, 'sizes'), { name });
}
export function deleteSize(id) {
  return deleteDoc(doc(db, 'sizes', id));
}