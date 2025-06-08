import { db } from './firebase.js';
import { doc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js';

let inMemoryCart = [];

// Carrito en memoria
export function addToCartLocal(productId, qty = 1) {
  const idx = inMemoryCart.findIndex(i => i.productId === productId);
  if (idx > -1) inMemoryCart[idx].qty += qty;
  else          inMemoryCart.push({ productId, qty });
  return getCartTotal();
}

export function removeFromCartLocal(productId) {
  inMemoryCart = inMemoryCart.filter(i => i.productId !== productId);
  return getCartTotal();
}

export function getCartItems() {
  return [...inMemoryCart];
}

export function getCartTotal() {
  return inMemoryCart.reduce((sum, i) => sum + i.qty, 0);
}

// Guardar en Firestore (cuando el usuario lo desee)
export async function saveCartToFirestore(uid) {
  const userRef = doc(db, 'users', uid);
  return updateDoc(userRef, { cart: inMemoryCart });
}
