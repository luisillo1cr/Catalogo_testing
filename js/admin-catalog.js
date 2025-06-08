// js/admin-catalog.js
import { onAuthChange, logout, isAdmin } from './auth.js';
import { fetchAllProductsAdmin }        from './products.js';

const catalogList = document.getElementById('admin-catalog-list');

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
      <div class="card h-100 shadow-sm">
        <div class="card-img-container">
          ${p.tags?.[0] ? `<span class="card-tag">${p.tags[0]}</span>` : ''}
          <img src="${p.imageURL}" class="card-img-top" alt="${p.name}">
        </div>
        <div class="card-body d-flex flex-column">
          <h6 class="card-title">${p.name}</h6>
          <p class="mb-1 fw-bold">₡ ${p.price.toLocaleString('es-CR')}</p>
          <p class="text-muted">Stock: ${p.stock}</p>
        </div>
      </div>`;
    catalogList.appendChild(col);
  });
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
