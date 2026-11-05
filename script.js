const hamburger = document.getElementById('hamburger');
const navbar = document.getElementById('navbar');
const header = document.getElementById('header');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.fade-section');
const backToTop = document.getElementById('backToTop');

// Search & Filter elements
const searchInput = document.getElementById('searchInput');
const filterBtns = document.querySelectorAll('.filter-btn');
const menuCards = document.querySelectorAll('.menu-card');
const noResults = document.getElementById('noResults');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');

// Cart elements
const cartToggle = document.getElementById('cartToggle');
const cartClose = document.getElementById('cartClose');
const cartOverlay = document.getElementById('cartOverlay');
const cartDrawer = document.getElementById('cartDrawer');
const cartItemsEl = document.getElementById('cartItems');
const cartFooter = document.getElementById('cartFooter');
const cartBadge = document.getElementById('cartBadge');
const cartTotalEl = document.getElementById('cartTotal');
const clearCartBtn = document.getElementById('clearCartBtn');
const checkoutBtn = document.getElementById('checkoutBtn');
const orderNoteInput = document.getElementById('orderNote');
const toast = document.getElementById('toast');

// 1. Mobile Navigation Toggle
function closeMobileNav() {
  hamburger.classList.remove('active');
  navbar.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
}

hamburger.addEventListener('click', () => {
  const isOpen = navbar.classList.toggle('open');
  hamburger.classList.toggle('active', isOpen);
  hamburger.setAttribute('aria-expanded', String(isOpen));
});

navLinks.forEach(link => {
  link.addEventListener('click', closeMobileNav);
});

// 2. Section Fade-in & Active Nav Link on Scroll
const appearObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
);

const activeSectionObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  },
  { threshold: 0.35 }
);

sections.forEach(section => {
  appearObserver.observe(section);
  activeSectionObserver.observe(section);
});

// 3. Header Scroll Effect & Back-to-Top Button
window.addEventListener('scroll', () => {
  const scrolled = window.scrollY > 60;
  header.classList.toggle('scrolled', scrolled);
  backToTop.classList.toggle('show', window.scrollY > 400);
});

backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// 4. Search & Dietary Filter Logic
let currentFilter = 'all';

function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();
  let totalVisible = 0;

  sections.forEach(section => {
    const cards = section.querySelectorAll('.menu-card');
    let sectionVisibleCount = 0;

    cards.forEach(card => {
      const name = (card.dataset.name || '').toLowerCase();
      const desc = (card.querySelector('p')?.textContent || '').toLowerCase();
      const tags = (card.dataset.tags || '').toLowerCase().split(/\s+/);

      const matchesSearch = !query || name.includes(query) || desc.includes(query);
      const matchesFilter = currentFilter === 'all' || tags.includes(currentFilter);

      const isVisible = matchesSearch && matchesFilter;
      card.hidden = !isVisible;
      if (isVisible) {
        sectionVisibleCount++;
        totalVisible++;
      }
    });

    section.hidden = sectionVisibleCount === 0;
    if (sectionVisibleCount > 0) {
      section.classList.add('visible');
    }
  });

  noResults.hidden = totalVisible > 0;
}

searchInput.addEventListener('input', applyFilters);

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter || 'all';
    applyFilters();
  });
});

resetFiltersBtn.addEventListener('click', () => {
  searchInput.value = '';
  currentFilter = 'all';
  filterBtns.forEach(b => b.classList.toggle('active', b.dataset.filter === 'all'));
  applyFilters();
});

// 5. Order Cart & Toast System
let cart = [];
try {
  const saved = localStorage.getItem('obadee_cart');
  if (saved) cart = JSON.parse(saved);
} catch {
  cart = [];
}

function saveCart() {
  try {
    localStorage.setItem('obadee_cart', JSON.stringify(cart));
  } catch {
    // Ignore storage errors
  }
}

let toastTimeout;
function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.hidden = true;
  }, 2600);
}

function formatNaira(amount) {
  return `₦${Number(amount).toLocaleString('en-NG')}`;
}

function renderCart() {
  const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  cartBadge.textContent = String(totalCount);
  cartTotalEl.textContent = formatNaira(totalPrice);

  if (cart.length === 0) {
    cartItemsEl.innerHTML = '<p class="cart-empty">Your order tray is empty. Select dishes from the menu to begin!</p>';
    cartFooter.hidden = true;
    return;
  }

  cartFooter.hidden = false;
  cartItemsEl.innerHTML = '';

  cart.forEach(item => {
    const row = document.createElement('div');
    row.className = 'cart-item';

    const info = document.createElement('div');
    info.className = 'cart-item-info';
    const title = document.createElement('h4');
    title.textContent = item.name;
    const sub = document.createElement('span');
    sub.textContent = `${formatNaira(item.price)} × ${item.qty} = ${formatNaira(item.price * item.qty)}`;
    info.append(title, sub);

    const controls = document.createElement('div');
    controls.className = 'cart-item-controls';

    const minusBtn = document.createElement('button');
    minusBtn.className = 'qty-btn';
    minusBtn.type = 'button';
    minusBtn.setAttribute('aria-label', `Decrease quantity of ${item.name}`);
    minusBtn.textContent = '−';
    minusBtn.addEventListener('click', () => updateQuantity(item.name, -1));

    const qtySpan = document.createElement('span');
    qtySpan.textContent = String(item.qty);

    const plusBtn = document.createElement('button');
    plusBtn.className = 'qty-btn';
    plusBtn.type = 'button';
    plusBtn.setAttribute('aria-label', `Increase quantity of ${item.name}`);
    plusBtn.textContent = '+';
    plusBtn.addEventListener('click', () => updateQuantity(item.name, 1));

    controls.append(minusBtn, qtySpan, plusBtn);
    row.append(info, controls);
    cartItemsEl.appendChild(row);
  });
}

function addToCart(name, price) {
  const existing = cart.find(item => item.name === name);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ name, price: Number(price), qty: 1 });
  }
  saveCart();
  renderCart();
  showToast(`Added "${name}" to your order`);
}

function updateQuantity(name, delta) {
  const idx = cart.findIndex(item => item.name === name);
  if (idx === -1) return;
  cart[idx].qty += delta;
  if (cart[idx].qty <= 0) {
    cart.splice(idx, 1);
  }
  saveCart();
  renderCart();
}

function setCartDrawerOpen(open) {
  cartDrawer.classList.toggle('open', open);
  cartDrawer.setAttribute('aria-hidden', String(!open));
  cartOverlay.hidden = !open;
}

cartToggle.addEventListener('click', () => setCartDrawerOpen(true));
cartClose.addEventListener('click', () => setCartDrawerOpen(false));
cartOverlay.addEventListener('click', () => setCartDrawerOpen(false));

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    setCartDrawerOpen(false);
    closeMobileNav();
  }
});

menuCards.forEach(card => {
  const btn = card.querySelector('.add-to-cart-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    addToCart(card.dataset.name, card.dataset.price);
  });
});

clearCartBtn.addEventListener('click', () => {
  cart = [];
  saveCart();
  renderCart();
  showToast('Order tray cleared');
});

checkoutBtn.addEventListener('click', () => {
  if (cart.length === 0) return;
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const note = orderNoteInput.value.trim();
  const noteSuffix = note ? ` (Note: ${note})` : '';
  cart = [];
  orderNoteInput.value = '';
  saveCart();
  renderCart();
  setCartDrawerOpen(false);
  showToast(`✅ Order placed (${formatNaira(totalPrice)})${noteSuffix}! Preparing your dishes.`);
});

renderCart();
