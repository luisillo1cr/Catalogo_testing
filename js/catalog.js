// js/catalog.js
import { fetchAllProducts }             from './products.js';
import { onAuthChange, isAdmin }        from './auth.js';
import { addToCartLocal, getCartTotal } from './cart.js';
import { db }                           from './firebase.js';
import {
  collection,
  onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js';

const productList  = document.getElementById('product-list');
const adminLink    = document.getElementById('admin-link');
const catFilter    = document.getElementById('filter-type');
const sizeFilter   = document.getElementById('filter-size');
const priceInput   = document.getElementById('filter-price');
const priceValue   = document.getElementById('price-value');
const priceMax     = document.getElementById('price-max');

let allProducts = [];

// Formateador de colones
const colonFormatter = new Intl.NumberFormat('es-CR', {
  style:   'currency',
  currency:'CRC',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

// --- 1️⃣ Carga inicial de productos ---
async function loadProducts() {
  try {
    allProducts = await fetchAllProducts();
    applyFilters();
  } catch (err) {
    console.error('Error cargando productos:', err);
    productList.innerHTML =
      '<p class="text-center text-danger">No se pudieron cargar los productos.</p>';
  }
}

// --- 2️⃣ Filtro ---
function applyFilters() {
  const selectedCategory = catFilter.value;
  const selectedSize     = sizeFilter.value;
  const maxPrice         = Number(priceInput.value);

  let filtered = allProducts.filter(p => p.active);

  // Categoría
  if (selectedCategory) {
    filtered = filtered.filter(p =>
      p.category === selectedCategory ||
      (Array.isArray(p.category) && p.category.includes(selectedCategory))
    );
  }
  // Talla
  if (selectedSize) {
    filtered = filtered.filter(p =>
      Array.isArray(p.sizes) && p.sizes.includes(selectedSize)
    );
  }
  // Precio
  filtered = filtered.filter(p =>
    typeof p.price === 'number' && p.price <= maxPrice
  );

  renderProducts(filtered);
}

// --- 3️⃣ Render de tarjetas ---
function renderProducts(products) {
  productList.innerHTML = '';
  if (!products.length) {
    productList.innerHTML = '<p class="text-center">No hay productos disponibles.</p>';
    return;
  }
  products.forEach(p => {
    const col = document.createElement('div');
    col.className = 'col-12 col-sm-6 col-md-4 col-lg-3';
    col.innerHTML = `
      <div class="card h-100 product-card" style="cursor:pointer">
        <div class="card-img-container">
          ${p.tags?.[0] ? `<span class="card-tag">${p.tags[0]}</span>` : ''}
          <img src="${(p.images?.[0] || p.imageURL)}" class="card-img-top" alt="${p.name}">
        </div>
        <div class="card-body d-flex flex-column">
          <h6 class="card-title">${p.name}</h6>
          <p class="mt-auto fw-bold">${colonFormatter.format(p.price)}</p>
          <button class="btn btn-primary mt-2 add-to-cart-btn">Agregar</button>
        </div>
      </div>`;
    
    // Click en tarjeta abre la ficha técnica
    col.querySelector('.card').addEventListener('click', e => {
      if (!e.target.classList.contains('add-to-cart-btn')) {
        showProductDetail(p);
      }
    });
    // Agregar al carrito
    col.querySelector('.add-to-cart-btn').onclick = ev => {
      ev.stopPropagation();
      addToCartLocal(p.id);
      document.getElementById('cart-count').textContent = getCartTotal();
    };

    productList.appendChild(col);
  });
}

// --- 3️⃣.1️⃣ Ficha técnica (igual que admin) ---
function showProductDetail(product) {
  const title = document.getElementById('productDetailTitle');
  const body  = document.getElementById('productDetailBody');
  title.textContent = product.name;

  const images = Array.isArray(product.images) && product.images.length
    ? product.images
    : product.imageURL
      ? [product.imageURL]
      : [];

  const imagesHtml = images.length
    ? `<div class="product-gallery mb-3">
         ${images.map(u => `<img src="${u}" alt="${product.name}">`).join('')}
       </div>`
    : '';

  body.innerHTML = `
    ${imagesHtml}
    <dl class="row mb-2">
      <dt class="col-5 col-md-3">Nombre:</dt><dd class="col-7 col-md-9">${product.name}</dd>
      <dt class="col-5 col-md-3">Precio:</dt><dd class="col-7 col-md-9">${colonFormatter.format(product.price)}</dd>
      <dt class="col-5 col-md-3">Stock:</dt><dd class="col-7 col-md-9">${product.stock}</dd>
      <dt class="col-5 col-md-3">Categoría:</dt><dd class="col-7 col-md-9">${product.category}</dd>
      <dt class="col-5 col-md-3">Tallas:</dt><dd class="col-7 col-md-9">${(product.sizes||[]).join(', ')}</dd>
      <dt class="col-5 col-md-3">Tags:</dt><dd class="col-7 col-md-9">${(product.tags||[]).join(', ')}</dd>
      <dt class="col-5 col-md-3">Color:</dt><dd class="col-7 col-md-9">${product.details?.color||'-'}</dd>
      <dt class="col-5 col-md-3">Descripción:</dt><dd class="col-7 col-md-9">${product.description||'-'}</dd>
    </dl>
  `;
  new bootstrap.Modal(document.getElementById('productDetailModal')).show();
}

// --- Sincroniza dinámico de categorías y tallas ---
function initDynamicFilters() {
  onSnapshot(collection(db,'categories'), snap => {
    catFilter.innerHTML = '<option value="">Todos</option>' +
      snap.docs.map(d => `<option>${d.data().name}</option>`).join('');
    applyFilters();
  });
  onSnapshot(collection(db,'sizes'), snap => {
    sizeFilter.innerHTML = '<option value="">Todas</option>' +
      snap.docs.map(d => `<option>${d.data().name}</option>`).join('');
    applyFilters();
  });
}

// --- 4️⃣ Inicialización ---
document.addEventListener('DOMContentLoaded', () => {
  initDynamicFilters();
  loadProducts();

  // Slider de precio
  priceValue.textContent = priceInput.value;
  priceMax.textContent   = priceInput.max;
  priceInput.addEventListener('input', () => {
    priceValue.textContent = priceInput.value;
    applyFilters();
  });

  catFilter.addEventListener('change', applyFilters);
  sizeFilter.addEventListener('change', applyFilters);
});

// --- 5️⃣ Enlace admin ---
onAuthChange(async user => {
  if (user && await isAdmin(user.uid)) {
    adminLink.classList.remove('d-none');
  }
});
