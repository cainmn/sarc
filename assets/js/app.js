const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const ADMIN_PASSWORD = '123456';
const WHATSAPP_NUMBER = '5521982111504';
const PRODUCTS_KEY = 'sarc-products-v2';
const PROJECTS_KEY = 'sarc-projects-v2';
const CART_KEY = 'sarc-cart';
const ADMIN_SESSION_KEY = 'sarc-admin-session';

const defaultProducts = [
  { id: '1', name: 'Ponteira SARC Inox 304', category: 'carro', type: 'Escape', price: 689, badge: 'Feito sob medida', image: '' },
  { id: '2', name: 'Kit Lateral Carbon Street', category: 'moto', type: 'Carbono', price: 1290, badge: 'Série limitada', image: '' },
  { id: '3', name: 'Difusor SARC RS', category: 'carro', type: 'Aerodinâmica', price: 1890, badge: 'Projeto 3D', image: '' },
  { id: '4', name: 'Protetor Carbon Torque', category: 'moto', type: 'Proteção', price: 790, badge: 'Carbono real', image: '' },
  { id: '5', name: 'Grade Hexa Black', category: 'universal', type: 'Acabamento', price: 249, badge: 'Universal', image: '' },
  { id: '6', name: 'Coilover Street Spec', category: 'carro', type: 'Suspensão', price: 3490, badge: 'Sob consulta', image: '' }
];

const defaultProjects = [
  {
    id: 'project-1',
    label: 'Projeto 001',
    title: 'Blackline Street',
    short: 'Postura baixa, rodas bem encaixadas e acabamento limpo para uso de rua.',
    description: 'Um projeto construído para manter a identidade original do carro, mas com presença muito mais forte. O trabalho combina estudo de postura, encaixe de rodas, detalhes de acabamento e revisão visual do conjunto.\n\nA proposta não foi adicionar elementos aleatórios, e sim fazer cada modificação conversar com a carroceria e com o uso real do veículo.',
    cover: 'assets/images/projeto-sarc-oficina.webp',
    gallery: ['assets/images/projeto-sarc-oficina-wide.webp', 'assets/images/projeto-sarc-roda.webp'],
    videos: [],
    visible: true,
    featured: true
  },
  {
    id: 'project-2',
    label: 'Projeto 002',
    title: 'Fitment & Postura',
    short: 'Acerto de altura e encaixe com foco em proporção, segurança e dirigibilidade.',
    description: 'O foco deste trabalho foi encontrar o equilíbrio entre estética e funcionamento. Foram avaliados altura, curso útil, espaço interno, alinhamento e comportamento do conjunto.\n\nO resultado é uma postura mais agressiva sem transformar cada lombada em uma negociação diplomática.',
    cover: 'assets/images/projeto-sarc-roda.webp',
    gallery: ['assets/images/projeto-sarc-contexto.webp', 'assets/images/projeto-sarc-oficina.webp'],
    videos: [],
    visible: true,
    featured: false
  },
  {
    id: 'project-3',
    label: 'Projeto 003',
    title: 'Oficina & Detalhes',
    short: 'Finalização técnica e visual para deixar o projeto coerente em cada ângulo.',
    description: 'A fase final recebe a mesma atenção das etapas grandes: alinhamento, fixação, folgas, acabamento, limpeza e revisão do conjunto.\n\nÉ nessa parte que um amontoado de peças começa a parecer um projeto de verdade.',
    cover: 'assets/images/projeto-sarc-contexto.webp',
    gallery: ['assets/images/projeto-sarc-oficina-wide.webp', 'assets/images/projeto-sarc-roda.webp'],
    videos: [],
    visible: true,
    featured: false
  }
];

function loadJSON(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (_) {
    return fallback;
  }
}

function readAdminSession() {
  try { return sessionStorage.getItem(ADMIN_SESSION_KEY) === '1'; }
  catch (_) { return false; }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeProject(project, index = 0) {
  return {
    id: String(project?.id || `project-${Date.now()}-${index}`),
    label: String(project?.label || `Projeto ${String(index + 1).padStart(3, '0')}`),
    title: String(project?.title || 'Projeto SARC'),
    short: String(project?.short || ''),
    description: String(project?.description || ''),
    cover: safeImageUrl(project?.cover || ''),
    gallery: Array.isArray(project?.gallery) ? project.gallery.map(safeImageUrl).filter(Boolean) : [],
    videos: Array.isArray(project?.videos) ? project.videos.map(safeVideoUrl).filter(Boolean) : [],
    visible: project?.visible !== false,
    featured: Boolean(project?.featured)
  };
}

const storedProjects = loadJSON(PROJECTS_KEY, null);
const state = {
  cart: loadJSON(CART_KEY, []),
  products: loadJSON(PRODUCTS_KEY, clone(defaultProducts)),
  projects: Array.isArray(storedProjects) ? storedProjects.map(normalizeProject) : clone(defaultProjects),
  filter: 'all',
  search: '',
  isAdmin: readAdminSession(),
  pendingImage: '',
  pendingProjectCover: '',
  pendingProjectGallery: []
};

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const categoryNames = { carro: 'Carro', moto: 'Moto', universal: 'Universal' };

const cartDrawer = $('.cart-drawer');
const backdrop = $('.drawer-backdrop');
const cartItems = $('.cart-items');
const cartEmpty = $('.cart-empty');
const toast = $('.toast');
const productGrid = $('#product-grid');
const projectsGrid = $('#projects-grid');
const adminPanel = $('#admin-panel');
const adminProductList = $('#admin-product-list');
const adminProjectList = $('#admin-project-list');
const loginModal = $('.login-modal');
const productModal = $('.product-modal');
const projectEditorModal = $('.project-editor-modal');
const projectDetailModal = $('.project-detail-modal');

function escapeHTML(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function cssEscape(value = '') {
  if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(String(value));
  return String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
}

function safeImageUrl(value = '') {
  const url = String(value || '').trim();
  if (/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(url)) return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (/^(\.\/)?assets\/images\/[a-z0-9._/-]+$/i.test(url)) return url.replace(/^\.\//, '');
  return '';
}

function safeVideoUrl(value = '') {
  const url = String(value || '').trim();
  return /^https?:\/\//i.test(url) ? url : '';
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function parseLines(value = '') {
  return String(value).split(/\r?\n/).map(item => item.trim()).filter(Boolean);
}

function buildWhatsAppUrl(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function openWhatsApp(message) {
  window.open(buildWhatsAppUrl(message), '_blank', 'noopener,noreferrer');
}

function initializeWhatsAppLinks() {
  $$('.whatsapp-link').forEach(link => {
    const message = link.dataset.whatsappMessage || 'Olá, SARC! Gostaria de falar sobre peças e serviços.';
    link.href = buildWhatsAppUrl(message);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2400);
}

function saveProducts() {
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(state.products));
    return true;
  } catch (_) {
    showToast('Sem espaço para salvar. Reduza as imagens enviadas.');
    return false;
  }
}

function saveProjects() {
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(state.projects));
    return true;
  } catch (_) {
    showToast('Sem espaço para salvar os projetos. Reduza a quantidade de imagens.');
    return false;
  }
}

function saveCart() {
  try { localStorage.setItem(CART_KEY, JSON.stringify(state.cart)); } catch (_) {}
  renderCart();
}

function setBackground(element, value) {
  if (!element) return;
  const url = safeImageUrl(value);
  element.style.backgroundImage = url ? `url("${url.replace(/"/g, '%22')}")` : 'none';
}

function renderProducts() {
  productGrid.innerHTML = state.products.map(product => {
    const name = escapeHTML(product.name);
    const type = escapeHTML(product.type || 'Peça');
    const category = escapeHTML(categoryNames[product.category] || 'Universal');
    const badge = escapeHTML(product.badge || 'SARC');
    return `
      <article class="product-card${state.isAdmin ? ' is-admin' : ''}" data-id="${escapeHTML(product.id)}" data-category="${escapeHTML(product.category)}" data-search="${escapeHTML(`${product.name} ${product.type} ${product.badge}`.toLowerCase())}">
        <div class="product-image image-slot">
          <span class="image-placeholder">SEM IMAGEM<br><small>${name}</small></span>
          <span class="product-badge">${badge}</span>
          ${state.isAdmin ? `<button class="admin-edit-card" type="button" data-edit-product="${escapeHTML(product.id)}">Editar</button>` : ''}
          <button class="quick-view" type="button" data-product-whatsapp="${escapeHTML(product.id)}" aria-label="Consultar ${name} no WhatsApp">↗</button>
        </div>
        <div class="product-info">
          <p>${type} / ${category}</p>
          <h3>${name}</h3>
          <div><strong>${currency.format(Number(product.price) || 0)}</strong><button class="add-cart" type="button" data-add-cart="${escapeHTML(product.id)}">Adicionar</button></div>
        </div>
      </article>`;
  }).join('');

  state.products.forEach(product => {
    const card = productGrid.querySelector(`[data-id="${cssEscape(product.id)}"]`);
    setBackground(card?.querySelector('.product-image'), product.image);
  });

  filterProducts();
}

function renderAdminProducts() {
  if (!state.isAdmin) {
    adminProductList.innerHTML = '';
    return;
  }

  adminProductList.innerHTML = state.products.map(product => `
    <article class="admin-product-row" data-admin-id="${escapeHTML(product.id)}">
      <div class="admin-thumb"></div>
      <div class="admin-product-name"><strong>${escapeHTML(product.name)}</strong><small>${escapeHTML(product.badge || 'Sem selo')}</small></div>
      <span>${escapeHTML(product.type)} / ${escapeHTML(categoryNames[product.category] || 'Universal')}</span>
      <strong>${currency.format(Number(product.price) || 0)}</strong>
      <div class="admin-row-actions">
        <button type="button" data-edit-product="${escapeHTML(product.id)}">Editar</button>
        <button class="delete-product" type="button" data-delete-product="${escapeHTML(product.id)}">Remover</button>
      </div>
    </article>`).join('');

  state.products.forEach(product => {
    const row = adminProductList.querySelector(`[data-admin-id="${cssEscape(product.id)}"]`);
    setBackground(row?.querySelector('.admin-thumb'), product.image);
  });
}

function filterProducts() {
  let visible = 0;
  $$('.product-card', productGrid).forEach(card => {
    const categoryMatch = state.filter === 'all' || card.dataset.category === state.filter;
    const nameMatch = (card.dataset.search || '').includes(state.search.toLowerCase());
    const show = categoryMatch && nameMatch;
    card.classList.toggle('hidden', !show);
    if (show) visible += 1;
  });
  $('.empty-state').hidden = visible !== 0;
}

function renderCart() {
  const count = state.cart.reduce((sum, item) => sum + item.qty, 0);
  const total = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  $('.cart-count').textContent = count;
  $('.cart-total').textContent = currency.format(total);
  cartEmpty.hidden = state.cart.length > 0;
  cartItems.innerHTML = state.cart.map(item => `
    <article class="cart-item">
      <div><h3>${escapeHTML(item.name)}</h3><p>${item.qty} × ${currency.format(item.price)}</p></div>
      <button type="button" data-remove="${escapeHTML(item.id)}" aria-label="Remover ${escapeHTML(item.name)}">×</button>
    </article>`).join('');
}

function addToCart(product) {
  const existing = state.cart.find(item => item.id === product.id);
  if (existing) existing.qty += 1;
  else state.cart.push({ id: product.id, name: product.name, price: Number(product.price) || 0, qty: 1 });
  saveCart();
  showToast('Peça adicionada ao carrinho');
}

function openCart() {
  cartDrawer.classList.add('open');
  cartDrawer.setAttribute('aria-hidden', 'false');
  backdrop.hidden = false;
  document.body.classList.add('locked');
}

function closeCart() {
  cartDrawer.classList.remove('open');
  cartDrawer.setAttribute('aria-hidden', 'true');
  backdrop.hidden = true;
  document.body.classList.remove('locked');
}

function renderProjects() {
  const visibleProjects = state.projects.filter(project => project.visible);
  projectsGrid.innerHTML = visibleProjects.map(project => `
    <article class="project-card-public${project.featured ? ' is-featured' : ''}" data-open-project="${escapeHTML(project.id)}" tabindex="0" role="button" aria-label="Ver detalhes do projeto ${escapeHTML(project.title)}">
      <span class="image-placeholder">SEM IMAGEM<br><small>${escapeHTML(project.title)}</small></span>
      <div class="project-card-copy">
        <span class="project-card-label">${escapeHTML(project.label)}</span>
        <h3>${escapeHTML(project.title)}</h3>
        <p>${escapeHTML(project.short)}</p>
        <span class="project-open-label">Ver detalhes, fotos e vídeos ↗</span>
      </div>
    </article>`).join('');

  visibleProjects.forEach(project => {
    const card = projectsGrid.querySelector(`[data-open-project="${cssEscape(project.id)}"]`);
    const cover = safeImageUrl(project.cover);
    setBackground(card, cover);
    card?.classList.toggle('has-image', Boolean(cover));
  });

  $('.projects-empty').hidden = visibleProjects.length > 0;
}

function renderAdminProjects() {
  if (!state.isAdmin) {
    adminProjectList.innerHTML = '';
    return;
  }

  adminProjectList.innerHTML = state.projects.map((project, index) => `
    <article class="admin-project-row" data-admin-project-id="${escapeHTML(project.id)}">
      <div class="admin-project-thumb"></div>
      <div class="admin-project-name"><strong>${escapeHTML(project.title)}</strong><small>${escapeHTML(project.label)} · posição ${index + 1}</small></div>
      <div class="admin-project-status">
        <span class="admin-status-chip${project.visible ? ' active' : ''}">${project.visible ? 'Publicado' : 'Oculto'}</span>
        ${project.featured ? '<span class="admin-status-chip active">Destaque</span>' : ''}
      </div>
      <div class="admin-project-actions">
        <button type="button" data-move-project="up" data-project-id="${escapeHTML(project.id)}" aria-label="Mover projeto para cima">↑</button>
        <button type="button" data-move-project="down" data-project-id="${escapeHTML(project.id)}" aria-label="Mover projeto para baixo">↓</button>
        <button type="button" data-toggle-project="${escapeHTML(project.id)}">${project.visible ? 'Ocultar' : 'Mostrar'}</button>
        <button type="button" data-feature-project="${escapeHTML(project.id)}">Destaque</button>
        <button type="button" data-edit-project="${escapeHTML(project.id)}">Editar</button>
        <button class="danger" type="button" data-delete-project="${escapeHTML(project.id)}">Remover</button>
      </div>
    </article>`).join('');

  state.projects.forEach(project => {
    const row = adminProjectList.querySelector(`[data-admin-project-id="${cssEscape(project.id)}"]`);
    setBackground(row?.querySelector('.admin-project-thumb'), project.cover);
  });
}

function renderAdminPanel() {
  adminPanel.hidden = !state.isAdmin;
  $('.user-button').classList.toggle('is-logged', state.isAdmin);
  $('.user-label').textContent = state.isAdmin ? 'Admin' : 'Usuário';
  $('.user-button').setAttribute('aria-label', state.isAdmin ? 'Abrir painel administrativo' : 'Entrar na área de usuário');
  renderAdminProducts();
  renderAdminProjects();
}

function setAdminSession(active) {
  state.isAdmin = active;
  try {
    if (active) sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
    else sessionStorage.removeItem(ADMIN_SESSION_KEY);
  } catch (_) {}
  renderAdminPanel();
  renderProducts();
  renderProjects();
}

function updateProductImagePreview(image) {
  const preview = $('#product-image-preview');
  const safe = safeImageUrl(image);
  preview.classList.toggle('has-image', Boolean(safe));
  setBackground(preview, safe);
}

function openProductEditor(product = null) {
  if (!state.isAdmin) return;
  $('#product-form').reset();
  $('.editor-status').textContent = '';
  state.pendingImage = product?.image || '';
  $('#product-id').value = product?.id || '';
  $('#product-name').value = product?.name || '';
  $('#product-category').value = product?.category || 'carro';
  $('#product-type').value = product?.type || '';
  $('#product-price').value = product?.price ?? '';
  $('#product-badge').value = product?.badge || '';
  $('#product-image-url').value = product?.image && !product.image.startsWith('data:image/') ? product.image : '';
  $('#product-modal-title').innerHTML = product ? 'EDITAR<br><em>PEÇA.</em>' : 'NOVA<br><em>PEÇA.</em>';
  updateProductImagePreview(state.pendingImage);
  productModal.showModal();
}

function resizeImage(file, max = 1500, quality = .8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler a imagem'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('Arquivo de imagem inválido'));
      image.onload = () => {
        const scale = Math.min(1, max / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        context.fillStyle = '#eeeeea';
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function updateProjectCoverPreview(image) {
  const preview = $('#project-cover-preview');
  const safe = safeImageUrl(image);
  preview.classList.toggle('has-image', Boolean(safe));
  setBackground(preview, safe);
}

function syncProjectGalleryTextarea() {
  $('#project-gallery-urls').value = state.pendingProjectGallery.filter(item => !item.startsWith('data:image/')).join('\n');
}

function renderProjectGalleryEditor() {
  const container = $('#project-gallery-editor');
  if (!state.pendingProjectGallery.length) {
    container.innerHTML = '<div class="project-gallery-empty">Nenhuma imagem adicional</div>';
    return;
  }

  container.innerHTML = state.pendingProjectGallery.map((image, index) => `
    <div class="project-gallery-edit-item" data-gallery-index="${index}">
      <button type="button" data-remove-gallery="${index}" aria-label="Remover imagem">×</button>
    </div>`).join('');

  state.pendingProjectGallery.forEach((image, index) => {
    setBackground(container.querySelector(`[data-gallery-index="${index}"]`), image);
  });
}

function openProjectEditor(project = null) {
  if (!state.isAdmin) return;
  $('#project-form').reset();
  $('.project-editor-status').textContent = '';
  state.pendingProjectCover = project?.cover || '';
  state.pendingProjectGallery = [...(project?.gallery || [])];

  $('#project-id').value = project?.id || '';
  $('#project-label').value = project?.label || `Projeto ${String(state.projects.length + 1).padStart(3, '0')}`;
  $('#project-title').value = project?.title || '';
  $('#project-short').value = project?.short || '';
  $('#project-description').value = project?.description || '';
  $('#project-cover-url').value = project?.cover && !project.cover.startsWith('data:image/') ? project.cover : '';
  $('#project-video-urls').value = (project?.videos || []).join('\n');
  $('#project-visible').checked = project?.visible !== false;
  $('#project-featured').checked = Boolean(project?.featured);
  $('#project-editor-title').innerHTML = project ? 'EDITAR<br><em>PROJETO.</em>' : 'NOVO<br><em>PROJETO.</em>';

  syncProjectGalleryTextarea();
  updateProjectCoverPreview(state.pendingProjectCover);
  renderProjectGalleryEditor();
  projectEditorModal.showModal();
}

function youtubeEmbedUrl(url) {
  try {
    const parsed = new URL(url);
    let id = '';
    if (parsed.hostname.includes('youtu.be')) id = parsed.pathname.split('/').filter(Boolean)[0] || '';
    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname === '/watch') id = parsed.searchParams.get('v') || '';
      else if (/^\/(embed|shorts)\//.test(parsed.pathname)) id = parsed.pathname.split('/')[2] || '';
    }
    return /^[a-zA-Z0-9_-]{6,20}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : '';
  } catch (_) {
    return '';
  }
}

function renderProjectVideos(videos) {
  const container = $('#project-video-list');
  container.innerHTML = videos.map((video, index) => {
    const youtube = youtubeEmbedUrl(video);
    if (youtube) {
      return `<div class="project-video"><iframe src="${escapeHTML(youtube)}" title="Vídeo do projeto ${index + 1}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;
    }
    if (/\.(mp4|webm)(\?.*)?$/i.test(video)) {
      return `<div class="project-video"><video src="${escapeHTML(video)}" controls preload="metadata"></video></div>`;
    }
    return `<a class="project-video-link" href="${escapeHTML(video)}" target="_blank" rel="noopener noreferrer"><span>Abrir vídeo ${index + 1}</span><b>↗</b></a>`;
  }).join('');
}

function showProjectMainImage(images, activeIndex) {
  const main = $('#project-detail-main');
  const image = images[activeIndex];
  main.innerHTML = image ? `<img src="${escapeHTML(image)}" alt="Imagem ${activeIndex + 1} do projeto">` : '<span class="no-media">Projeto sem imagens publicadas</span>';
  $$('.project-detail-thumb', $('#project-detail-thumbs')).forEach((thumb, index) => thumb.classList.toggle('active', index === activeIndex));
}

function openProjectDetails(project) {
  projectDetailModal.dataset.projectId = project.id;
  const images = unique([project.cover, ...(project.gallery || [])].map(safeImageUrl));
  $('#project-detail-label').textContent = project.label;
  $('#project-detail-title').textContent = project.title;
  $('#project-detail-short').textContent = project.short;
  $('#project-detail-description').textContent = project.description;

  const thumbs = $('#project-detail-thumbs');
  thumbs.innerHTML = images.map((image, index) => `<button class="project-detail-thumb${index === 0 ? ' active' : ''}" type="button" data-project-image-index="${index}" aria-label="Abrir imagem ${index + 1}"></button>`).join('');
  images.forEach((image, index) => setBackground(thumbs.querySelector(`[data-project-image-index="${index}"]`), image));
  showProjectMainImage(images, 0);
  renderProjectVideos(project.videos || []);

  const whatsapp = $('#project-whatsapp');
  whatsapp.href = buildWhatsAppUrl(`Olá, SARC! Vi o projeto “${project.title}” no site e gostaria de conversar sobre algo nessa linha para meu veículo.`);
  projectDetailModal.showModal();
}

productGrid.addEventListener('click', event => {
  const addButton = event.target.closest('[data-add-cart]');
  const editButton = event.target.closest('[data-edit-product]');
  const whatsappButton = event.target.closest('[data-product-whatsapp]');

  if (addButton) {
    const product = state.products.find(item => item.id === addButton.dataset.addCart);
    if (product) addToCart(product);
  }

  if (editButton) {
    const product = state.products.find(item => item.id === editButton.dataset.editProduct);
    if (product) openProductEditor(product);
  }

  if (whatsappButton) {
    const product = state.products.find(item => item.id === whatsappButton.dataset.productWhatsapp);
    if (product) openWhatsApp(`Olá, SARC! Quero confirmar aplicação, disponibilidade e prazo da peça “${product.name}”, anunciada por ${currency.format(Number(product.price) || 0)}.`);
  }
});

adminProductList.addEventListener('click', event => {
  const editButton = event.target.closest('[data-edit-product]');
  const deleteButton = event.target.closest('[data-delete-product]');

  if (editButton) {
    const product = state.products.find(item => item.id === editButton.dataset.editProduct);
    if (product) openProductEditor(product);
  }

  if (deleteButton) {
    const product = state.products.find(item => item.id === deleteButton.dataset.deleteProduct);
    if (!product || !confirm(`Remover “${product.name}” do catálogo?`)) return;
    state.products = state.products.filter(item => item.id !== product.id);
    state.cart = state.cart.filter(item => item.id !== product.id);
    saveProducts();
    saveCart();
    renderProducts();
    renderAdminProducts();
    showToast('Peça removida do catálogo');
  }
});

projectsGrid.addEventListener('click', event => {
  const button = event.target.closest('[data-open-project]');
  if (!button) return;
  const project = state.projects.find(item => item.id === button.dataset.openProject && item.visible);
  if (project) openProjectDetails(project);
});

projectsGrid.addEventListener('keydown', event => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  const card = event.target.closest('[data-open-project]');
  if (!card) return;
  event.preventDefault();
  const project = state.projects.find(item => item.id === card.dataset.openProject && item.visible);
  if (project) openProjectDetails(project);
});

adminProjectList.addEventListener('click', event => {
  const editButton = event.target.closest('[data-edit-project]');
  const deleteButton = event.target.closest('[data-delete-project]');
  const toggleButton = event.target.closest('[data-toggle-project]');
  const featureButton = event.target.closest('[data-feature-project]');
  const moveButton = event.target.closest('[data-move-project]');

  if (editButton) {
    const project = state.projects.find(item => item.id === editButton.dataset.editProject);
    if (project) openProjectEditor(project);
    return;
  }

  if (deleteButton) {
    const project = state.projects.find(item => item.id === deleteButton.dataset.deleteProject);
    if (!project || !confirm(`Remover o projeto “${project.title}”?`)) return;
    state.projects = state.projects.filter(item => item.id !== project.id);
    saveProjects();
    renderProjects();
    renderAdminProjects();
    showToast('Projeto removido');
    return;
  }

  if (toggleButton) {
    const project = state.projects.find(item => item.id === toggleButton.dataset.toggleProject);
    if (!project) return;
    project.visible = !project.visible;
    if (!project.visible) project.featured = false;
    saveProjects();
    renderProjects();
    renderAdminProjects();
    showToast(project.visible ? 'Projeto publicado' : 'Projeto ocultado');
    return;
  }

  if (featureButton) {
    const project = state.projects.find(item => item.id === featureButton.dataset.featureProject);
    if (!project) return;
    state.projects.forEach(item => { item.featured = item.id === project.id; });
    project.visible = true;
    saveProjects();
    renderProjects();
    renderAdminProjects();
    showToast('Projeto definido como destaque');
    return;
  }

  if (moveButton) {
    const index = state.projects.findIndex(item => item.id === moveButton.dataset.projectId);
    const target = moveButton.dataset.moveProject === 'up' ? index - 1 : index + 1;
    if (index < 0 || target < 0 || target >= state.projects.length) return;
    [state.projects[index], state.projects[target]] = [state.projects[target], state.projects[index]];
    saveProjects();
    renderProjects();
    renderAdminProjects();
  }
});

$('.user-button').addEventListener('click', () => {
  if (!state.isAdmin) {
    $('#login-form').reset();
    $('.login-error').textContent = '';
    loginModal.showModal();
    setTimeout(() => $('#admin-password').focus(), 50);
    return;
  }
  adminPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

$('#login-form').addEventListener('submit', event => {
  event.preventDefault();
  if ($('#admin-password').value !== ADMIN_PASSWORD) {
    $('.login-error').textContent = 'Senha incorreta.';
    $('#admin-password').select();
    return;
  }
  setAdminSession(true);
  loginModal.close();
  showToast('Painel administrativo liberado');
  setTimeout(() => adminPanel.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
});

$('.close-login-modal').addEventListener('click', () => loginModal.close());
$('.close-product-modal').addEventListener('click', () => productModal.close());
$('.close-project-editor').addEventListener('click', () => projectEditorModal.close());
$('.close-project-detail').addEventListener('click', () => projectDetailModal.close());

$('#logout-admin').addEventListener('click', () => {
  setAdminSession(false);
  showToast('Sessão administrativa encerrada');
});

$('#add-product').addEventListener('click', () => openProductEditor());
$('#add-project').addEventListener('click', () => openProjectEditor());

$('#reset-products').addEventListener('click', () => {
  if (!confirm('Restaurar o catálogo padrão? As alterações atuais serão substituídas.')) return;
  state.products = clone(defaultProducts);
  saveProducts();
  renderProducts();
  renderAdminProducts();
  showToast('Catálogo padrão restaurado');
});

$('#reset-projects').addEventListener('click', () => {
  if (!confirm('Restaurar os projetos padrão? As alterações atuais serão substituídas.')) return;
  state.projects = clone(defaultProjects);
  saveProjects();
  renderProjects();
  renderAdminProjects();
  showToast('Projetos padrão restaurados');
});

$('#product-image-url').addEventListener('input', event => {
  if (event.target.value.trim()) {
    state.pendingImage = event.target.value.trim();
    updateProductImagePreview(state.pendingImage);
  }
});

$('#product-image-file').addEventListener('change', async event => {
  const file = event.target.files[0];
  if (!file) return;
  $('.editor-status').textContent = 'Processando imagem...';
  try {
    state.pendingImage = await resizeImage(file);
    $('#product-image-url').value = '';
    updateProductImagePreview(state.pendingImage);
    $('.editor-status').textContent = 'Imagem pronta para salvar.';
  } catch (error) {
    $('.editor-status').textContent = error.message;
  }
});

$('#product-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!state.isAdmin) return;
  const id = $('#product-id').value || (window.crypto?.randomUUID ? window.crypto.randomUUID() : String(Date.now()));
  const imageUrl = $('#product-image-url').value.trim();
  const image = imageUrl || state.pendingImage || '';
  const product = {
    id,
    name: $('#product-name').value.trim(),
    category: $('#product-category').value,
    type: $('#product-type').value.trim(),
    price: Number($('#product-price').value),
    badge: $('#product-badge').value.trim() || 'SARC',
    image: safeImageUrl(image)
  };
  const index = state.products.findIndex(item => item.id === id);
  if (index >= 0) state.products[index] = product;
  else state.products.unshift(product);

  state.cart = state.cart.map(item => item.id === id ? { ...item, name: product.name, price: product.price } : item);
  if (!saveProducts()) return;
  saveCart();
  renderProducts();
  renderAdminProducts();
  productModal.close();
  showToast(index >= 0 ? 'Peça atualizada' : 'Nova peça adicionada');
});

$('#project-cover-url').addEventListener('input', event => {
  state.pendingProjectCover = event.target.value.trim();
  updateProjectCoverPreview(state.pendingProjectCover);
});

$('#project-cover-file').addEventListener('change', async event => {
  const file = event.target.files[0];
  if (!file) return;
  $('.project-editor-status').textContent = 'Processando a capa...';
  try {
    state.pendingProjectCover = await resizeImage(file, 1800, .8);
    $('#project-cover-url').value = '';
    updateProjectCoverPreview(state.pendingProjectCover);
    $('.project-editor-status').textContent = 'Capa pronta para salvar.';
  } catch (error) {
    $('.project-editor-status').textContent = error.message;
  }
});

$('#project-gallery-urls').addEventListener('input', event => {
  const uploadedImages = state.pendingProjectGallery.filter(item => item.startsWith('data:image/'));
  const urls = parseLines(event.target.value).map(safeImageUrl).filter(Boolean);
  state.pendingProjectGallery = unique([...uploadedImages, ...urls]);
  renderProjectGalleryEditor();
});

$('#project-gallery-files').addEventListener('change', async event => {
  const files = [...event.target.files].slice(0, 8);
  if (!files.length) return;
  $('.project-editor-status').textContent = `Processando ${files.length} imagem(ns)...`;
  try {
    const images = [];
    for (const file of files) images.push(await resizeImage(file, 1400, .75));
    state.pendingProjectGallery = unique([...state.pendingProjectGallery, ...images]);
    renderProjectGalleryEditor();
    $('.project-editor-status').textContent = 'Galeria pronta para salvar.';
    event.target.value = '';
  } catch (error) {
    $('.project-editor-status').textContent = error.message;
  }
});

$('#project-gallery-editor').addEventListener('click', event => {
  const button = event.target.closest('[data-remove-gallery]');
  if (!button) return;
  state.pendingProjectGallery.splice(Number(button.dataset.removeGallery), 1);
  syncProjectGalleryTextarea();
  renderProjectGalleryEditor();
});

$('#project-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!state.isAdmin) return;

  const id = $('#project-id').value || (window.crypto?.randomUUID ? window.crypto.randomUUID() : `project-${Date.now()}`);
  const coverUrl = $('#project-cover-url').value.trim();
  const visible = $('#project-visible').checked;
  const featured = $('#project-featured').checked;
  const galleryUrls = parseLines($('#project-gallery-urls').value).map(safeImageUrl).filter(Boolean);
  const uploadedGallery = state.pendingProjectGallery.filter(item => item.startsWith('data:image/'));
  const project = normalizeProject({
    id,
    label: $('#project-label').value.trim() || 'Projeto SARC',
    title: $('#project-title').value.trim(),
    short: $('#project-short').value.trim(),
    description: $('#project-description').value.trim(),
    cover: coverUrl || state.pendingProjectCover,
    gallery: unique([...uploadedGallery, ...galleryUrls]),
    videos: parseLines($('#project-video-urls').value),
    visible: featured ? true : visible,
    featured
  });

  if (!project.cover) {
    $('.project-editor-status').textContent = 'Adicione uma imagem de capa válida.';
    return;
  }

  const index = state.projects.findIndex(item => item.id === id);
  if (featured) state.projects.forEach(item => { item.featured = false; });
  if (index >= 0) state.projects[index] = project;
  else state.projects.push(project);

  if (!saveProjects()) return;
  renderProjects();
  renderAdminProjects();
  projectEditorModal.close();
  showToast(index >= 0 ? 'Projeto atualizado' : 'Projeto adicionado');
});

$('#project-detail-thumbs').addEventListener('click', event => {
  const button = event.target.closest('[data-project-image-index]');
  if (!button) return;
  const projectId = projectDetailModal.dataset.projectId;
  const project = state.projects.find(item => item.id === projectId);
  if (!project) return;
  const images = unique([project.cover, ...(project.gallery || [])].map(safeImageUrl));
  showProjectMainImage(images, Number(button.dataset.projectImageIndex));
});


$('.cart-button').addEventListener('click', openCart);
$('.close-cart').addEventListener('click', closeCart);
backdrop.addEventListener('click', closeCart);
cartItems.addEventListener('click', event => {
  const button = event.target.closest('[data-remove]');
  if (!button) return;
  state.cart = state.cart.filter(item => item.id !== button.dataset.remove);
  saveCart();
});

$('.checkout-button').addEventListener('click', () => {
  if (!state.cart.length) return showToast('Adicione uma peça antes de finalizar');
  const lines = state.cart.map(item => `• ${item.qty}x ${item.name} — ${currency.format(item.price * item.qty)}`);
  const total = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  openWhatsApp(`Olá, SARC! Tenho interesse nestas peças:\n${lines.join('\n')}\nTotal estimado: ${currency.format(total)}. Gostaria de confirmar aplicação, disponibilidade e prazo.`);
});

$$('.filter').forEach(button => button.addEventListener('click', () => {
  $$('.filter').forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  state.filter = button.dataset.filter;
  filterProducts();
}));

$('#product-search').addEventListener('input', event => {
  state.search = event.target.value.trim();
  filterProducts();
});

[loginModal, productModal, projectEditorModal, projectDetailModal].forEach(modal => modal.addEventListener('click', event => {
  const rect = modal.getBoundingClientRect();
  const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  if (outside) modal.close();
}));

const menuToggle = $('.menu-toggle');
const nav = $('.main-nav');
menuToggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
});
$$('.main-nav a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
}));

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeCart();
});

$('#year').textContent = new Date().getFullYear();
initializeWhatsAppLinks();
renderProducts();
renderProjects();
renderAdminPanel();
renderCart();
