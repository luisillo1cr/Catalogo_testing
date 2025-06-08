// js/admin.js
import { onAuthChange, logout, isAdmin } from './auth.js';
import {
  fetchCategories,
  addCategory,
  deleteCategory,
  fetchTags,
  addTag,
  deleteTag
} from './meta.js';
import {
  fetchAllProductsAdmin as fetchAllProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  topViewed,
  topSold
} from './products.js';

let adminProducts = [];
let prodModal, prodForm;
let catModal, catForm, catList;
let tagModal, tagForm, tagList;
let editingId = null;

// Render tabla de productos
function renderTable() {
  const tbody = document.getElementById('products-table');
  tbody.innerHTML = '';
  adminProducts.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${p.imageURL}" width="50"></td>
      <td>${p.name}</td>
      <td>₡ ${p.price.toLocaleString('es-CR')}</td>
      <td>${p.stock}</td>
      <td>
        <input type="checkbox" ${p.active?'checked':''} data-id="${p.id}" class="toggle-active"/>
      </td>
      <td class="text-end">
        <button class="btn btn-sm btn-warning me-1 edit" data-id="${p.id}">Editar</button>
        <button class="btn btn-sm btn-danger del" data-id="${p.id}">Eliminar</button>
      </td>`;
    tbody.append(tr);
  });

  // Listeners de toggle, editar y eliminar
  tbody.querySelectorAll('.toggle-active').forEach(cb => {
    cb.onclick = async () => {
      await updateProduct(cb.dataset.id, { active: cb.checked });
    };
  });
  tbody.querySelectorAll('.edit').forEach(btn => {
    btn.onclick = () => openProductModal(btn.dataset.id);
  });
  tbody.querySelectorAll('.del').forEach(btn => {
    btn.onclick = async () => {
      if (confirm('¿Eliminar este producto?')) {
        await deleteProduct(btn.dataset.id);
        await loadAdmin();
      }
    };
  });
}

// Carga métricas
async function loadMetrics() {
  const [mv] = await topViewed();
  const [ms] = await topSold();
  document.getElementById('top-viewed').textContent = mv?.name || '–';
  document.getElementById('top-sold').textContent   = ms?.name || '–';
}

// Rellena categorías y tags en el formulario
async function loadProductFormMeta() {
  // CARGAR CATEGORÍAS
  const cats = await fetchCategories();
  const catSel = document.getElementById('form-category');
  catSel.innerHTML =
    '<option value="">Selecciona...</option>' +
    cats.map(c => `<option value="${c.name}">${c.name}</option>`).join('');

  // CARGAR TAGS en un <select multiple>
  const tags = await fetchTags();
  const tagSel = document.getElementById('form-tags');
  tagSel.innerHTML =
    tags.map(t => `<option value="${t.name}">${t.name}</option>`).join('');
}

// Abre modal producto (nuevo o editar)
async function openProductModal(id) {
  editingId = id;
  prodForm.reset();
  prodForm.image.required = id ? false : true;
  prodForm.querySelector('.modal-title').textContent =
    id ? 'Editar Producto' : 'Agregar Producto';
  await loadProductFormMeta();

  if (id) {
    const p = adminProducts.find(x => x.id === id);
    prodForm.name.value        = p.name;
    prodForm.price.value       = p.price;
    prodForm.stock.value       = p.stock;
    prodForm.active.checked    = p.active;
    prodForm.description.value = p.description || '';
    prodForm.category.value    = p.category;
    prodForm.tags.value        = p.tags?.join(', ') || '';
    prodForm.color.value       = p.details?.color || '';
    prodForm.size.value        = p.details?.talla || '';

  const tagSel = document.getElementById('form-tags');
  Array.from(tagSel.options).forEach(opt => {
    opt.selected = p.tags?.includes(opt.value) || false;
  });
  }

  prodModal.show();
}

// Maneja submit de producto
async function onProductSubmit(e) {
  e.preventDefault();
  // Toma el primer fichero (imagen principal)
  const file = prodForm.image.files[0];

  // 1) Obtén los tags seleccionados del <select multiple>
  const selectedTags = Array.from(prodForm.tags.selectedOptions)
    .map(opt => opt.value);

  // 2) Construye el objeto data
  const data = {
    name:        prodForm.name.value.trim(),
    price:       Number(prodForm.price.value),
    stock:       Number(prodForm.stock.value),
    active:      prodForm.active.checked,
    description: prodForm.description.value.trim(),
    category:    prodForm.category.value,
    tags:        selectedTags,
    details: {
      color: prodForm.color.value.trim(),
      talla: prodForm.size.value.trim()
    }
  };

  try {
    if (editingId) {
      // Editar producto existente
      await updateProduct(editingId, data, file);
    } else {
      // Crear nuevo producto
      await addProduct(data, file);
    }
    // Cerrar modal y recargar tabla
    prodModal.hide();
    await loadAdmin();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}


// Carga tabla y métricas
async function loadAdmin() {
  adminProducts = await fetchAllProducts();
  renderTable();
  loadMetrics();
}

// Inyección de CRUD de categorías
async function openCatModal() {
  catList.innerHTML = '';
  const cats = await fetchCategories();
  cats.forEach(c => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between';
    li.textContent = c.name;
    const btn = document.createElement('button');
    btn.className = 'btn btn-sm btn-danger';
    btn.innerHTML = '<i class="bi bi-trash"></i>';
    btn.onclick = async () => {
      await deleteCategory(c.id);
      openCatModal();
    };
    li.append(btn);
    catList.append(li);
  });
  catModal.show();
}
async function onCatSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('new-cat-name').value.trim();
  if (name) {
    await addCategory(name);
    document.getElementById('new-cat-name').value = '';
    openCatModal();
  }
}

// CRUD de tags
async function openTagModal() {
  tagList.innerHTML = '';
  const tags = await fetchTags();
  tags.forEach(t => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between';
    li.textContent = t.name;
    const btn = document.createElement('button');
    btn.className = 'btn btn-sm btn-danger';
    btn.innerHTML = '<i class="bi bi-trash"></i>';
    btn.onclick = async () => {
      await deleteTag(t.id);
      openTagModal();
    };
    li.append(btn);
    tagList.append(li);
  });
  tagModal.show();
}
async function onTagSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('new-tag-name').value.trim();
  if (name) {
    await addTag(name);
    document.getElementById('new-tag-name').value = '';
    openTagModal();
  }
}

// Inicialización al cambiar auth
onAuthChange(async user => {
  if (!user || !(await isAdmin(user.uid))) {
    window.location.href = './index.html';
    return;
  }
  document.getElementById('btn-logout').onclick = () => logout();

  // Modals y formularios
  prodModal = new bootstrap.Modal(document.getElementById('prodModal'));
  prodForm  = document.getElementById('form-add');
  prodForm.addEventListener('submit', onProductSubmit);

  catModal = new bootstrap.Modal(document.getElementById('catModal'));
  catList  = document.getElementById('cat-list');
  catForm  = document.getElementById('form-cat');
  document.getElementById('btn-manage-cats').onclick = openCatModal;
  catForm.addEventListener('submit', onCatSubmit);

  tagModal = new bootstrap.Modal(document.getElementById('tagModal'));
  tagList  = document.getElementById('tag-list');
  tagForm  = document.getElementById('form-tag');
  document.getElementById('btn-manage-tags').onclick = openTagModal;
  tagForm.addEventListener('submit', onTagSubmit);

  // Botón Agregar producto
  document.getElementById('btn-add').onclick = () => openProductModal(null);

  // Carga inicial
  await loadAdmin();
});
