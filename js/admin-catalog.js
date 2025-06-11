// js/admin-catalog.js
import { db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { onAuthChange, logout, isAdmin } from './auth.js';
import { fetchAllProductsAdmin } from './products.js';

// UID's a Nombres de usuario
async function uidToName(uid) {
  if (!uid) return "-";
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return uid;
    const user = snap.data();
    return user.name || user.displayName || user.email || uid;
  } catch {
    return uid;
  }
}

const catalogList = document.getElementById('admin-catalog-list');

// Formato de colones
const colonFormatter = new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

// Render de tarjetas para admins
function renderCatalog(products) {
  catalogList.innerHTML = '';
  if (!products.length) {
    catalogList.innerHTML = '<p class="text-center">No hay productos.</p>';
    return;
  }
  products.forEach(p => {
    const col = document.createElement('div');
    col.className = 'col-12 col-sm-6 col-md-4 col-lg-3';
    col.innerHTML = `
      <div class="card h-100 shadow-sm product-card" style="cursor:pointer;">
        <div class="card-img-container">
          ${p.tags?.[0] ? `<span class="card-tag">${p.tags[0]}</span>` : ''}
          <img src="${(p.images && p.images.length) ? p.images[0] : p.imageURL}" class="card-img-top" alt="${p.name}">
        </div>
        <div class="card-body d-flex flex-column">
          <h6 class="card-title">${p.name}</h6>
          <p class="mb-1 fw-bold">${colonFormatter.format(p.price)}</p>
          <p class="text-muted">Stock: ${p.stock}</p>
        </div>
      </div>`;
    // Clic en la tarjeta muestra la ficha técnica
    col.querySelector('.card').addEventListener('click', () => showProductDetail(p));
    catalogList.appendChild(col);
  });
}

// Ficha técnica (modal)
async function showProductDetail(product) {
  const title = document.getElementById('productDetailTitle');
  const body  = document.getElementById('productDetailBody');
  title.textContent = product.name;

  // Busca los nombres
  const [createdBy, updatedBy, deletedBy] = await Promise.all([
    uidToName(product.createdBy),
    uidToName(product.updatedBy),
    uidToName(product.deletedBy)
  ]);

  // Soporta galería (images[]), o una imagen única (retrocompatibilidad)
  let images = [];
  if (product.images && Array.isArray(product.images) && product.images.length) {
    images = product.images;
  } else if (product.imageURL) {
    images = [product.imageURL];
  }
  let imagesHtml = '';
  if (images.length) {
    imagesHtml = `<div class="product-gallery mb-3">` +
      images.map(url => `<img src="${url}" alt="foto de ${product.name}" style="max-width:90px; margin-right:8px;">`).join('') +
      `</div>`;
  }

  // Auditoría (solo admins)
  const auditHtml = `
    <hr>
    <h6>Auditoría</h6>
    <dl class="row">
      <dt class="col-5 col-md-4">Creado por:</dt>
      <dd class="col-7 col-md-8">${createdBy} <span class="text-muted small">${product.createdAt?.toDate ? product.createdAt.toDate().toLocaleString() : '-'}</span></dd>
      <dt class="col-5 col-md-4">Editado por:</dt>
      <dd class="col-7 col-md-8">${updatedBy} <span class="text-muted small">${product.updatedAt?.toDate ? product.updatedAt.toDate().toLocaleString() : '-'}</span></dd>
      <dt class="col-5 col-md-4">Eliminado por:</dt>
      <dd class="col-7 col-md-8">${deletedBy} <span class="text-muted small">${product.deletedAt?.toDate ? product.deletedAt.toDate().toLocaleString() : '-'}</span></dd>
    </dl>
  `;

  body.innerHTML = `
    ${imagesHtml}
    <dl class="row mb-2">
      <dt class="col-5 col-md-3">Nombre:</dt>
      <dd class="col-7 col-md-9">${product.name}</dd>
      <dt class="col-5 col-md-3">Precio:</dt>
      <dd class="col-7 col-md-9">₡ ${product.price.toLocaleString('es-CR')}</dd>
      <dt class="col-5 col-md-3">Stock:</dt>
      <dd class="col-7 col-md-9">${product.stock ?? '-'}</dd>
      <dt class="col-5 col-md-3">Categoría:</dt>
      <dd class="col-7 col-md-9">${product.category || '-'}</dd>
      <dt class="col-5 col-md-3">Tags:</dt>
      <dd class="col-7 col-md-9">${(product.tags && product.tags.length) ? product.tags.join(', ') : '-'}</dd>
      <dt class="col-5 col-md-3">Color:</dt>
      <dd class="col-7 col-md-9">${product.details?.color || '-'}</dd>
      <dt class="col-5 col-md-3">Talla:</dt>
      <dd class="col-7 col-md-9">${product.details?.talla || '-'}</dd>
      <dt class="col-5 col-md-3">Descripción:</dt>
      <dd class="col-7 col-md-9">${product.description || '-'}</dd>
    </dl>
    ${auditHtml}
  `;

  new bootstrap.Modal(document.getElementById('productDetailModal')).show();
}


// Inicialización: carga y render
async function loadCatalog() {
  try {
    const prods = await fetchAllProductsAdmin();
    renderCatalog(prods);
  } catch (err) {
    console.error('Error cargando catálogo admin:', err);
    catalogList.innerHTML = '<p class="text-center text-danger">Error cargando productos.</p>';
  }
}

// Control de acceso: sólo admins
onAuthChange(async user => {
  if (!user || !(await isAdmin(user.uid))) {
    window.location.href = 'index.html';
  } else {
    document.getElementById('btn-logout').onclick = () => logout();
    loadCatalog();
  }
});

// --- Opcional: Galería de imágenes, estilo ---
const css = `.product-gallery { display:flex; gap:10px; flex-wrap:wrap; }
.product-gallery img { max-width:110px; max-height:110px; object-fit:cover; border-radius:5px; border:1px solid #eee; box-shadow:0 2px 6px #0001; }`;
const style = document.createElement('style');
style.innerHTML = css;
document.head.appendChild(style);
