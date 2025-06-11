// js/admin.js
import { onAuthChange, logout, isAdmin } from './auth.js';
import {
  fetchCategories, addCategory, deleteCategory,
  fetchTags, addTag, deleteTag,
  fetchSizes, addSize, deleteSize
} from './meta.js';
import {
  fetchAllProductsAdmin as fetchAllProducts,
  addProductMulti,
  updateProductMulti,
  deleteProduct,
  topViewed,
  topSold
} from './products.js';

let adminProducts = [];
let prodModal, prodForm;
let catModal, catForm, catList;
let tagModal, tagForm, tagList;
let sizeModal, sizeForm, sizeList;
let editingId = null;

let existingImages = [];
let newFiles = [];

// 1️⃣ Render tabla de productos
function renderTable() {
  const tbody = document.getElementById('products-table');
  tbody.innerHTML = '';
  adminProducts.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        ${Array.isArray(p.images) && p.images.length
          ? `<img src="${p.images[0]}" width="50">`
          : p.imageURL
            ? `<img src="${p.imageURL}" width="50">`
            : ''
        }
      </td>
      <td>${p.name}</td>
      <td>₡ ${p.price.toLocaleString('es-CR')}</td>
      <td>${p.stock}</td>
      <td>
        <input type="checkbox" ${p.active ? 'checked' : ''} data-id="${p.id}" class="toggle-active"/>
      </td>
      <td class="text-end">
        <button class="btn btn-sm btn-warning me-1 edit" data-id="${p.id}">Editar</button>
        <button class="btn btn-sm btn-danger del" data-id="${p.id}">Eliminar</button>
      </td>`;
    tbody.append(tr);
  });

  // Listeners
  tbody.querySelectorAll('.toggle-active').forEach(cb => {
    cb.onclick = async () => {
      await updateProductMulti(cb.dataset.id, { active: cb.checked });
      await loadAdmin();
    };
  });
  tbody.querySelectorAll('.edit').forEach(b => {
    b.onclick = () => openProductModal(b.dataset.id);
  });
  tbody.querySelectorAll('.del').forEach(b => {
    b.onclick = async () => {
      if (confirm('¿Eliminar este producto?')) {
        await deleteProduct(b.dataset.id);
        await loadAdmin();
      }
    };
  });
}

// 2️⃣ Métricas
async function loadMetrics() {
  const [mv] = await topViewed();
  const [ms] = await topSold();
  document.getElementById('top-viewed').textContent = mv?.name || '–';
  document.getElementById('top-sold').textContent   = ms?.name || '–';
}

// 3️⃣ Rellena categorías, tags y tallas en el form
async function loadProductFormMeta() {
  // Categorías
  const cats = await fetchCategories();
  const catSel = document.getElementById('form-category');
  catSel.innerHTML =
    '<option value="">Selecciona...</option>' +
    cats.map(c => `<option value="${c.name}">${c.name}</option>`).join('');

  // Tags
  const tags = await fetchTags();
  const tagSel = document.getElementById('form-tags');
  tagSel.innerHTML =
    tags.map(t => `<option value="${t.name}">${t.name}</option>`).join('');

  // Tallas
  const sizes = await fetchSizes();
  const sizeSel = document.getElementById('form-sizes');
  sizeSel.innerHTML =
    sizes.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
}

// 4️⃣ Modal Agregar/Editar Producto
async function openProductModal(id) {
  // Demo: limitar a 8 productos
  if (!id && adminProducts.length >= 8) {
    return alert('Demo: has alcanzado el límite de 8 productos.');
  }

  editingId = id;
  prodForm.reset();
  newFiles = [];
  existingImages = [];
  document.getElementById('preview-images').innerHTML = '';
  prodForm.images.required = !id;
  prodForm.querySelector('.modal-title').textContent = id ? 'Editar Producto' : 'Agregar Producto';

  await loadProductFormMeta();

  if (id) {
    const p = adminProducts.find(x => x.id === id);
    prodForm.name.value        = p.name;
    prodForm.price.value       = p.price;
    prodForm.stock.value       = p.stock;
    prodForm.active.checked    = p.active;
    prodForm.description.value = p.description || '';
    prodForm.category.value    = p.category;
    Array.from(document.getElementById('form-tags').options)
      .forEach(o => o.selected = p.tags?.includes(o.value));
    Array.from(document.getElementById('form-sizes').options)
      .forEach(o => o.selected = p.sizes?.includes(o.value));
    prodForm.color.value = p.details?.color || '';

    // Preview imágenes existentes
    existingImages = Array.isArray(p.images) ? p.images : (p.imageURL ? [p.imageURL] : []);
    document.getElementById('preview-images').innerHTML =
      existingImages.map(url =>
        `<img src="${url}" width="75" class="m-1 border rounded">`
      ).join('');
  }

  // Drag & Drop + click
  const dropzone  = document.getElementById('image-dropzone');
  const fileInput = document.getElementById('form-images');
  dropzone.onclick = () => fileInput.click();
  dropzone.ondragover  = e => { e.preventDefault(); dropzone.classList.add('dragover'); };
  dropzone.ondragleave = () => dropzone.classList.remove('dragover');
  dropzone.ondrop      = e => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    newFiles = Array.from(e.dataTransfer.files).slice(0,4);
    renderPreview();
  };
  fileInput.onchange = () => {
    newFiles = Array.from(fileInput.files).slice(0,4);
    renderPreview();
  };

  prodModal.show();
}

// 5️⃣ Vista previa de imágenes
function renderPreview() {
  const container = document.getElementById('preview-images');
  const imgs = existingImages.concat(newFiles.map(f => URL.createObjectURL(f)));
  container.innerHTML = imgs
    .map(u => `<img src="${u}" width="75" class="m-1 border rounded">`)
    .join('');
}

// 6️⃣ Guardar Producto
async function onProductSubmit(e) {
  e.preventDefault();
  const files = newFiles;
  if (!files.length && !existingImages.length && !editingId) {
    return alert('Debes subir al menos 1 imagen.');
  }
  if (files.length + existingImages.length > 4) {
    return alert('Máximo 4 imágenes.');
  }
  const data = {
    name:        prodForm.name.value.trim(),
    price:       Number(prodForm.price.value),
    stock:       Number(prodForm.stock.value),
    active:      prodForm.active.checked,
    description: prodForm.description.value.trim(),
    category:    prodForm.category.value,
    tags:        Array.from(document.getElementById('form-tags').selectedOptions).map(o => o.value),
    sizes:       Array.from(document.getElementById('form-sizes').selectedOptions).map(o => o.value),
    details:     { color: prodForm.color.value.trim() },
    images:      existingImages
  };
  try {
    if (editingId) {
      await updateProductMulti(editingId, data, files);
    } else {
      await addProductMulti(data, files);
    }
    prodModal.hide();
    await loadAdmin();
  } catch (err) {
    alert(`Error al guardar producto: ${err.message}`);
  }
}

// 7️⃣ Carga tabla y métricas + límite demo
async function loadAdmin() {
  adminProducts = await fetchAllProducts();
  renderTable();
  loadMetrics();

  // Límite demo: máximo 8 productos
  const btnAdd = document.getElementById('btn-add');
  if (adminProducts.length >= 8) {
    btnAdd.disabled = true;
    btnAdd.textContent = 'Límite alcanzado';
  } else {
    btnAdd.disabled = false;
    btnAdd.textContent = 'Agregar Producto';
  }
}

// 8️⃣ CRUD Categorías
async function openCatModal() {
  catList = document.getElementById('cat-list');
  catList.innerHTML = '';
  for (const c of await fetchCategories()) {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between';
    li.textContent = c.name;
    const btn = document.createElement('button');
    btn.className = 'btn btn-sm btn-danger';
    btn.innerHTML = '<i class="bi bi-trash"></i>';
    btn.onclick = async () => { await deleteCategory(c.id); openCatModal(); };
    li.append(btn);
    catList.append(li);
  }
  catModal.show();
}
async function onCatSubmit(e) {
  e.preventDefault();
  const inp = document.getElementById('new-cat-name');
  if (inp.value.trim()) {
    await addCategory(inp.value.trim());
    inp.value = '';
    openCatModal();
  }
}

// 9️⃣ CRUD Tags
async function openTagModal() {
  tagList = document.getElementById('tag-list');
  tagList.innerHTML = '';
  for (const t of await fetchTags()) {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between';
    li.textContent = t.name;
    const btn = document.createElement('button');
    btn.className = 'btn btn-sm btn-danger';
    btn.innerHTML = '<i class="bi bi-trash"></i>';
    btn.onclick = async () => { await deleteTag(t.id); openTagModal(); };
    li.append(btn);
    tagList.append(li);
  }
  tagModal.show();
}
async function onTagSubmit(e) {
  e.preventDefault();
  const inp = document.getElementById('new-tag-name');
  if (inp.value.trim()) {
    await addTag(inp.value.trim());
    inp.value = '';
    openTagModal();
  }
}

// 🔟 CRUD Tallas
async function openSizeModal() {
  sizeList = document.getElementById('size-list');
  sizeList.innerHTML = '';
  for (const s of await fetchSizes()) {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between';
    li.textContent = s.name;
    const btn = document.createElement('button');
    btn.className = 'btn btn-sm btn-danger';
    btn.innerHTML = '<i class="bi bi-trash"></i>';
    btn.onclick = async () => { await deleteSize(s.id); openSizeModal(); };
    li.append(btn);
    sizeList.append(li);
  }
  sizeModal.show();
}
async function onSizeSubmit(e) {
  e.preventDefault();
  const inp = document.getElementById('new-size-name');
  if (inp.value.trim()) {
    await addSize(inp.value.trim());
    inp.value = '';
    openSizeModal();
  }
}

// ↪️ Inicialización
onAuthChange(async user => {
  if (!user || !(await isAdmin(user.uid))) {
    window.location.href = './index.html';
    return;
  }
  document.getElementById('btn-logout').onclick = () => logout();

  // Producto
  prodModal = new bootstrap.Modal(document.getElementById('prodModal'));
  prodForm  = document.getElementById('form-add');
  prodForm.addEventListener('submit', onProductSubmit);

  // Categorías
  catModal = new bootstrap.Modal(document.getElementById('catModal'));
  catForm  = document.getElementById('form-cat');
  document.getElementById('btn-manage-cats').onclick = openCatModal;
  catForm.addEventListener('submit', onCatSubmit);

  // Tags
  tagModal = new bootstrap.Modal(document.getElementById('tagModal'));
  tagForm  = document.getElementById('form-tag');
  document.getElementById('btn-manage-tags').onclick = openTagModal;
  tagForm.addEventListener('submit', onTagSubmit);

  // Tallas
  sizeModal = new bootstrap.Modal(document.getElementById('sizeModal'));
  sizeForm  = document.getElementById('form-size');
  document.getElementById('btn-manage-sizes').onclick = openSizeModal;
  sizeForm.addEventListener('submit', onSizeSubmit);

  // Nuevo producto
  document.getElementById('btn-add').onclick = () => openProductModal(null);

  // Carga inicial
  await loadAdmin();
});
