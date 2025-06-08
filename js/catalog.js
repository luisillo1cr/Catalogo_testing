// js/catalog.js
import { fetchAllProducts }             from './products.js';
import { onAuthChange, isAdmin }        from './auth.js';
import { addToCartLocal, getCartTotal } from './cart.js';

const productList = document.getElementById('product-list');
const adminLink   = document.getElementById('admin-link');

let allProducts = [];

// Creamos un formateador de colones
const colonFormatter = new Intl.NumberFormat('es-CR', {
  style:                'currency',
  currency:             'CRC',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

// 1️⃣ Carga inicial de productos
async function loadProducts() {
  try {
    allProducts = await fetchAllProducts();
    console.log('🔥 Productos cargados:', allProducts);
    applyFilters();  // muestra los activos al inicio
  } catch (err) {
    console.error('Error cargando productos:', err);
    productList.innerHTML =
      '<p class="text-center text-danger">No se pudieron cargar los productos.</p>';
  }
}

// 2️⃣ Filtrado según controles
function applyFilters() {
  const selectedCategory = document.getElementById('filter-type').value;
  const selectedSize     = document.getElementById('filter-size').value;
  const maxPrice         = Number(document.getElementById('filter-price').value);

  let filtered = allProducts.filter(p => p.active);

  if (selectedCategory) {
    filtered = filtered.filter(p =>
      Array.isArray(p.category) &&
      p.category.includes(selectedCategory)
    );
  }
  if (selectedSize) {
    filtered = filtered.filter(p =>
      p.details?.talla === selectedSize
    );
  }
  filtered = filtered.filter(p => typeof p.price === 'number' && p.price <= maxPrice);

  renderProducts(filtered);
}

// 3️⃣ Render de tarjetas
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
      <div class="card h-100">
        <div class="card-img-container">
          ${p.tags?.[0] ? `<span class="card-tag">${p.tags[0]}</span>` : ''}
          <img src="${p.imageURL}" class="card-img-top" alt="${p.name}">
        </div>
        <div class="card-body d-flex flex-column">
          <h6 class="card-title">${p.name}</h6>
          <p class="mt-auto fw-bold">
            ${colonFormatter.format(p.price)}
          </p>
          <button class="btn btn-primary mt-2">Agregar</button>
        </div>
      </div>`;
    col.querySelector('button').onclick = () => {
      addToCartLocal(p.id);
      document.getElementById('cart-count').textContent = getCartTotal();
    };
    productList.appendChild(col);
  });
}

// 4️⃣ Inicialización al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();

  // Slider de precio
  const priceInput = document.getElementById('filter-price');
  const priceVal   = document.getElementById('price-value');
  const priceMaxEl = document.getElementById('price-max');

  // Init valores formateados
  priceVal.textContent   = priceInput.value;
  priceMaxEl.textContent = priceInput.max;

  // Al mover el slider
  priceInput.addEventListener('input', () => {
    priceVal.textContent = priceInput.value;
    applyFilters();
  });

  // Al cambiar categoría o talla
  document.getElementById('filter-type').addEventListener('change', applyFilters);
  document.getElementById('filter-size').addEventListener('change', applyFilters);
});

// 5️⃣ Mostrar enlace admin si corresponde
onAuthChange(async user => {
  if (user && await isAdmin(user.uid)) {
    adminLink.classList.remove('d-none');
  }
});
