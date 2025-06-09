// js/products.js
import { db, storage } from './firebase.js';
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  limit,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js';
import {
  ref,
  uploadBytes,
  getDownloadURL
} from 'https://www.gstatic.com/firebasejs/10.4.0/firebase-storage.js';


// Trae sólo los productos activos para catálogo público
export async function fetchAllProducts() {
  const q    = query(
    collection(db, 'products'),
    where('active', '==', true)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Para el Admin: trae todos los productos (activo o no)
export async function fetchAllProductsAdmin() {
  const snap = await getDocs(collection(db, 'products'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Agrega un producto (sube imagen, obtiene URL y crea el documento)
export async function addProduct(data, file) {
  const imgRef = ref(storage, `products/${Date.now()}_${file.name}`);
  await uploadBytes(imgRef, file);
  data.imageURL  = await getDownloadURL(imgRef);
  data.views     = 0;
  data.sold      = 0;
  data.active    = true;
  data.createdAt = serverTimestamp();
  return addDoc(collection(db, 'products'), data);
}

// Actualiza un producto (solo campos concretos)
export function updateProduct(id, updates) {
  return updateDoc(doc(db, 'products', id), updates);
}

// Elimina un producto
export function deleteProduct(id) {
  return deleteDoc(doc(db, 'products', id));
}

// Métricas
export async function topViewed(limitCount = 1) {
  const q    = query(
    collection(db, 'products'),
    orderBy('views', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function topSold(limitCount = 1) {
  const q    = query(
    collection(db, 'products'),
    orderBy('sold', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}


/**
 * Crea un producto subiendo de 1 a 4 imágenes.
 * data  = objeto con campos name, price, stock, active, description, category, tags, details
 * files = FileList con entre 1 y 4 imágenes
 */
export async function addProductMulti(data, files) {
  if (!files || files.length < 1) {
    throw new Error('Debes subir al menos una imagen.');
  }
  if (files.length > 4) {
    throw new Error('No puedes subir más de 4 imágenes.');
  }
  // Sube cada imagen y obtiene su URL
  const urls = await Promise.all(
    Array.from(files).map(file => {
      const imgRef = ref(storage, `products/${Date.now()}_${file.name}`);
      return uploadBytes(imgRef, file).then(() => getDownloadURL(imgRef));
    })
  );
  data.images    = urls;
  data.views     = 0;
  data.sold      = 0;
  data.active    = true;
  data.createdAt = serverTimestamp();
  return addDoc(collection(db, 'products'), data);
}

/**
 * Actualiza un producto y reemplaza sus imágenes si se proporcionan nuevas.
 * id    = ID del producto
 * data  = objeto con campos a actualizar
 * files = FileList con nuevas imágenes (0 a 4)
 */
export async function updateProductMulti(id, data, files) {
  if (files && files.length > 0) {
    if (files.length > 4) {
      throw new Error('No puedes subir más de 4 imágenes.');
    }
    const urls = await Promise.all(
      Array.from(files).map(file => {
        const imgRef = ref(storage, `products/${Date.now()}_${file.name}`);
        return uploadBytes(imgRef, file).then(() => getDownloadURL(imgRef));
      })
    );
    data.images = urls;
  }
  data.updatedAt = serverTimestamp();
  return updateDoc(doc(db, 'products', id), data);
}
