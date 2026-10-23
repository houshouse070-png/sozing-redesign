/* ============================================================
   Sozing — site script
   Winkelmandje (localStorage), bestel-flow, contactformulier
   ============================================================ */

const CART_KEY = 'sozingCart';
const DELIVERY_FEE = 2.50;
const FREE_DELIVERY_FROM = 25.00;

/* ---------- Helpers ---------- */
function formatPrice(n) {
  return '€ ' + n.toFixed(2).replace('.', ',');
}

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  const count = document.getElementById('cartCount');
  if (!count) return;
  const total = getCart().reduce((sum, item) => sum + item.qty, 0);
  count.textContent = total;
  count.style.display = total > 0 ? 'flex' : 'none';
}

/* ---------- Toast ---------- */
let toastTimer;
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

/* ---------- Cart operations ---------- */
function addToCart(name, price) {
  const cart = getCart();
  const existing = cart.find(item => item.name === name);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ name: name, price: price, qty: 1 });
  }
  saveCart(cart);
  showToast(name + ' toegevoegd ✓');
  if (document.getElementById('cartItems')) renderCart();
}

function changeQty(name, delta) {
  let cart = getCart();
  const item = cart.find(i => i.name === name);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(i => i.name !== name);
  saveCart(cart);
  renderCart();
}

function removeItem(name) {
  saveCart(getCart().filter(i => i.name !== name));
  renderCart();
}

function cartSubtotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.qty, 0);
}

function currentMode() {
  const pickup = document.getElementById('pickupBtn');
  return (pickup && !pickup.classList.contains('active')) ? 'delivery' : 'pickup';
}

function deliveryFee() {
  if (currentMode() !== 'delivery') return 0;
  return cartSubtotal() >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
}

function cartTotal() {
  return cartSubtotal() + deliveryFee();
}

/* ---------- Cart rendering (order page sidebar) ---------- */
function renderCart() {
  const itemsEl = document.getElementById('cartItems');
  if (!itemsEl) return;
  const cart = getCart();
  const emptyEl = document.getElementById('cartEmpty');
  const totalsEl = document.getElementById('cartTotals');

  if (cart.length === 0) {
    itemsEl.innerHTML = '';
    emptyEl.style.display = 'block';
    totalsEl.style.display = 'none';
    return;
  }

  emptyEl.style.display = 'none';
  totalsEl.style.display = 'block';

  itemsEl.innerHTML = cart.map(item => `
    <div class="cart-row">
      <div class="cart-row-info">
        <h4>${item.name}</h4>
        <span class="unit">${formatPrice(item.price)} p.s.</span>
      </div>
      <div class="qty-controls">
        <button type="button" onclick="changeQty('${item.name.replace(/'/g, "\'")}', -1)" aria-label="Minder">&minus;</button>
        <span class="qty">${item.qty}</span>
        <button type="button" onclick="changeQty('${item.name.replace(/'/g, "\'")}', 1)" aria-label="Meer">+</button>
      </div>
      <span class="line-total">${formatPrice(item.price * item.qty)}</span>
      <button type="button" class="remove" onclick="removeItem('${item.name.replace(/'/g, "\'")}')" aria-label="Verwijderen">&#10005;</button>
    </div>`).join('');

  document.getElementById('subTotal').textContent = formatPrice(cartSubtotal());

  const fee = deliveryFee();
  const feeRow = document.getElementById('deliveryRow');
  if (currentMode() === 'delivery') {
    feeRow.style.display = 'flex';
    document.getElementById('deliveryFee').textContent =
      fee === 0 ? 'Gratis' : formatPrice(fee);
  } else {
    feeRow.style.display = 'none';
  }
  document.getElementById('grandTotal').textContent = formatPrice(cartTotal());
}

/* ---------- Order flow (bestellen.html) ---------- */
function setMode(mode) {
  const pickup = document.getElementById('pickupBtn');
  const delivery = document.getElementById('deliveryBtn');
  const hint = document.getElementById('toggleHint');
  if (!pickup) return;

  if (mode === 'pickup') {
    pickup.classList.add('active');
    delivery.classList.remove('active');
    hint.textContent = 'Afhalen: Willemskade 9, Zwolle — meestal klaar binnen 20 minuten.';
    document.getElementById('addressRow').style.display = 'none';
    document.getElementById('fAddress').required = false;
  } else {
    delivery.classList.add('active');
    pickup.classList.remove('active');
    hint.innerHTML = 'Bezorging in Zwolle — € 2,50 bezorgkosten, gratis vanaf € 25,00. Gemiddeld binnen 45 minuten.';
    document.getElementById('addressRow').style.display = 'block';
    document.getElementById('fAddress').required = true;
  }
  renderCart();
  updateSteps();
}

function showStep(step) {
  const menuPicker = document.getElementById('menuPicker');
  const form = document.getElementById('customerForm');
  const confirm = document.getElementById('confirmView');
  const success = document.getElementById('successView');
  if (!menuPicker) return;
  [menuPicker, form, confirm, success].forEach(el => el.style.display = 'none');
  if (step === 1) menuPicker.style.display = 'block';
  if (step === 2) form.style.display = 'block';
  if (step === 3) confirm.style.display = 'block';
  if (step === 4) success.style.display = 'block';
  updateSteps(step);
}

function updateSteps(step) {
  const steps = [document.getElementById('step1'), document.getElementById('step2'), document.getElementById('step3')];
  if (!steps[0]) return;
  steps.forEach((el, i) => el.classList.toggle('active', i + 1 === (step || 1)));
}

function goToForm() {
  if (getCart().length === 0) {
    showToast('Je winkelmandje is nog leeg');
    return;
  }
  showStep(2);
  updateSteps(2);
}

function validateForm() {
  const name = document.getElementById('fName').value.trim();
  const phone = document.getElementById('fPhone').value.trim();
  const address = document.getElementById('fAddress').value.trim();
  const err = document.getElementById('formError');

  if (name.length < 2) { err.textContent = 'Vul je naam in.'; return false; }
  if (phone.replace(/\D/g, '').length < 9) { err.textContent = 'Vul een geldig telefoonnummer in.'; return false; }
  if (currentMode() === 'delivery' && address.length < 6) { err.textContent = 'Vul je bezorgadres in.'; return false; }
  err.textContent = '';
  return true;
}

function buildConfirmSummary() {
  const cart = getCart();
  const name = document.getElementById('fName').value.trim();
  const mode = currentMode() === 'delivery' ? 'Bezorgen' : 'Afhalen';
  const time = document.getElementById('fTime').value;
  const address = document.getElementById('fAddress').value.trim();
  const notes = document.getElementById('fNotes').value.trim();

  let html = '<h3>Overzicht</h3><ul>';
  cart.forEach(item => {
    html += <li><span>${item.qty} × ${item.name}</span><span>${formatPrice(item.price * item.qty)}</span></li>;
  });
  html += `</ul>
    <div class="c-meta">
      <strong>${mode}</strong> · ${time}<br>
      ${name}${address && mode === 'Bezorgen' ? '<br>' + address : ''}
      ${notes ? '<br>Opmerking: ' + notes : ''}
    </div>
    <div class="c-total"><span>Totaal${mode === 'Bezorgen' && deliveryFee() === 0 ? ' (gratis bezorgd)' : ''}</span><span>${formatPrice(cartTotal())}</span></div>`;
  document.getElementById('confirmSummary').innerHTML = html;
}

function placeOrder() {
  const orderNumber = 'SZ-' + Math.floor(1000 + Math.random() * 9000);
  const name = document.getElementById('fName').value.trim();
  document.getElementById('orderNumber').textContent = orderNumber;
  document.getElementById('successName').textContent = name;
  document.getElementById('successEta').textContent =
    currentMode() === 'delivery'
      ? 'Bezorging gemiddeld binnen 45 minuten.'
      : 'Afhalen meestal klaar binnen 20 minuten.';
  localStorage.removeItem(CART_KEY);
  updateCartBadge();
  renderCart();
  showStep(4);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------- Contact form (contact.html) ---------- */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const name = document.getElementById('cName').value.trim();
    const email = document.getElementById('cEmail').value.trim();
    const msg = document.getElementById('cMessage').value.trim();
    const err = document.getElementById('contactError');

    if (name.length < 2) { err.textContent = 'Vul je naam in.'; return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { err.textContent = 'Vul een geldig e-mailadres in.'; return; }
    if (msg.length < 5) { err.textContent = 'Schrijf een bericht.'; return; }
    err.textContent = '';

    form.style.display = 'none';
    document.getElementById('contactSuccess').style.display = 'block';
  });
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', function () {

  /* Mobile nav */
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle) {
    navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  }

  /* Add-to-cart buttons on every page */
  document.querySelectorAll('[data-name][data-price]').forEach(btn => {
    btn.addEventListener('click', () => {
      addToCart(btn.dataset.name, parseFloat(btn.dataset.price));
    });
  });

  updateCartBadge();
  renderCart();
  initContactForm();

  /* Order page wiring */
  const pickupBtn = document.getElementById('pickupBtn');
  if (pickupBtn) {
    pickupBtn.addEventListener('click', () => setMode('pickup'));
    document.getElementById('deliveryBtn').addEventListener('click', () => setMode('delivery'));

    document.getElementById('checkoutBtn').addEventListener('click', () => {
      goToForm();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.getElementById('backToCart').addEventListener('click', () => {
      showStep(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.getElementById('toConfirm').addEventListener('click', () => {
      if (!validateForm()) return;
      buildConfirmSummary();
      showStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.getElementById('backToForm').addEventListener('click', () => {
      showStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.getElementById('placeOrderBtn').addEventListener('click', placeOrder);

    document.getElementById('newOrderBtn').addEventListener('click', () => {
      showStep(1);
      document.getElementById('orderForm').reset();
      setMode('pickup');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
});
