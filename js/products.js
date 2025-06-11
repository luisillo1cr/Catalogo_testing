// js/products.js
import { db, storage, auth } from './firebase.js';
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


// 1️⃣ Catálogo público: sólo productos activos
export async function fetchAllProducts() {
  const q    = query(
    collection(db, 'products'),
    where('active', '==', true)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// 2️⃣ Catálogo admin: todos los productos
export async function fetchAllProductsAdmin() {
  const snap = await getDocs(collection(db, 'products'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// 3️⃣ Añadir producto (única imagen, retrocompatibilidad)
export async function addProduct(data, file) {
  const imgRef = ref(storage, `products/${Date.now()}_${file.name}`);
  await uploadBytes(imgRef, file);
  data.imageURL  = await getDownloadURL(imgRef);

  // Auditoría de creación
  data.createdBy = auth.currentUser.uid;
  data.createdAt = serverTimestamp();

  data.views     = 0;
  data.sold      = 0;
  data.active    = true;
  return addDoc(collection(db, 'products'), data);
}

// 4️⃣ Actualizar producto (campos concretos)
export function updateProduct(id, updates) {
  return updateDoc(doc(db, 'products', id), updates);
}

// 5️⃣ Eliminar producto (borrado físico)
export function deleteProduct(id) {
  return deleteDoc(doc(db, 'products', id));
}

// 6️⃣ Métricas
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


// 7️⃣ Agregar producto con hasta 4 imágenes
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
  data.images = urls;

  // Auditoría de creación
  data.createdBy = auth.currentUser.uid;
  data.createdAt = serverTimestamp();

  data.views  = 0;
  data.sold   = 0;
  data.active = true;
  return addDoc(collection(db, 'products'), data);
}

// 8️⃣ Actualizar producto con múltiples imágenes opcionales
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

  // Auditoría de actualización
  data.updatedBy = auth.currentUser.uid;
  data.updatedAt = serverTimestamp();

  return updateDoc(doc(db, 'products', id), data);
}
