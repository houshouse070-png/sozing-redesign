
/* ============================================================
   Sozing — site script
   Winkelmandje, bestel-flow, WhatsApp-bestellingen,
   contactformulier
   ============================================================ */

const CART_KEY = 'sozingCart';
const DELIVERY_FEE = 2.50;
const FREE_DELIVERY_FROM = 25.00;
const WHATSAPP_NUMBER = '2347035960615';

/* ---------- Helpers ---------- */
function formatPrice(n) {
  return '€ ' + Number(n).toFixed(2).replace('.', ',');
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

  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2200);
}

/* ---------- Cart operations ---------- */
function addToCart(name, price) {
  const cart = getCart();
  const existing = cart.find(item => item.name === name);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ name, price, qty: 1 });
  }

  saveCart(cart);
  showToast(name + ' toegevoegd ✓');

  if (document.getElementById('cartItems')) {
    renderCart();
  }
}

function changeQty(name, delta) {
  let cart = getCart();
  const item = cart.find(i => i.name === name);

  if (!item) return;

  item.qty += delta;

  if (item.qty <= 0) {
    cart = cart.filter(i => i.name !== name);
  }

  saveCart(cart);
  renderCart();
}

function removeItem(name) {
  saveCart(getCart().filter(i => i.name !== name));
  renderCart();
}

function cartSubtotal() {
  return getCart().reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );
}

function currentMode() {
  const pickup = document.getElementById('pickupBtn');

  return pickup && !pickup.classList.contains('active')
    ? 'delivery'
    : 'pickup';
}

function deliveryFee() {
  if (currentMode() !== 'delivery') return 0;

  return cartSubtotal() >= FREE_DELIVERY_FROM
    ? 0
    : DELIVERY_FEE;
}

function cartTotal() {
  return cartSubtotal() + deliveryFee();
}

/* ---------- Cart rendering ---------- */
function renderCart() {
  const itemsEl = document.getElementById('cartItems');
  if (!itemsEl) return;

  const cart = getCart();
  const emptyEl = document.getElementById('cartEmpty');
  const totalsEl = document.getElementById('cartTotals');

  if (cart.length === 0) {
    itemsEl.replaceChildren();
    if (emptyEl) emptyEl.style.display = 'block';
    if (totalsEl) totalsEl.style.display = 'none';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';
  if (totalsEl) totalsEl.style.display = 'block';

  itemsEl.replaceChildren();

  cart.forEach(item => {
    const row = document.createElement('div');
    row.className = 'cart-row';

    const info = document.createElement('div');
    info.className = 'cart-row-info';

    const name = document.createElement('h4');
    name.textContent = item.name;

    const unit = document.createElement('span');
    unit.className = 'unit';
    unit.textContent = formatPrice(item.price) + ' p.s.';

    info.append(name, unit);

    const controls = document.createElement('div');
    controls.className = 'qty-controls';

    const minus = document.createElement('button');
    minus.type = 'button';
    minus.textContent = '−';
    minus.setAttribute('aria-label', 'Minder');
    minus.addEventListener('click', () => changeQty(item.name, -1));

    const qty = document.createElement('span');
    qty.className = 'qty';
    qty.textContent = item.qty;

    const plus = document.createElement('button');
    plus.type = 'button';
    plus.textContent = '+';
    plus.setAttribute('aria-label', 'Meer');
    plus.addEventListener('click', () => changeQty(item.name, 1));

    controls.append(minus, qty, plus);

    const lineTotal = document.createElement('span');
    lineTotal.className = 'line-total';
    lineTotal.textContent = formatPrice(item.price * item.qty);

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove';
    remove.textContent = '×';
    remove.setAttribute('aria-label', 'Verwijderen');
    remove.addEventListener('click', () => removeItem(item.name));

    row.append(info, controls, lineTotal, remove);
    itemsEl.appendChild(row);
  });

  const subtotalEl = document.getElementById('subTotal');
  const feeRow = document.getElementById('deliveryRow');
  const feeEl = document.getElementById('deliveryFee');
  const totalEl = document.getElementById('grandTotal');

  if (subtotalEl) {
    subtotalEl.textContent = formatPrice(cartSubtotal());
  }

  if (currentMode() === 'delivery') {
    if (feeRow) feeRow.style.display = 'flex';
    if (feeEl) {
      feeEl.textContent = deliveryFee() === 0
        ? 'Gratis'
        : formatPrice(deliveryFee());
    }
  } else if (feeRow) {
    feeRow.style.display = 'none';
  }

  if (totalEl) {
    totalEl.textContent = formatPrice(cartTotal());
  }
}

/* ---------- Order flow ---------- */
function setMode(mode) {
  const pickup = document.getElementById('pickupBtn');
  const delivery = document.getElementById('deliveryBtn');
  const hint = document.getElementById('toggleHint');

  if (!pickup || !delivery || !hint) return;

  const addressRow = document.getElementById('addressRow');
  const addressInput = document.getElementById('fAddress');

  if (mode === 'pickup') {
    pickup.classList.add('active');
    delivery.classList.remove('active');

    hint.textContent =
      'Afhalen: Willemskade 9, Zwolle — meestal klaar binnen 20 minuten.';

    if (addressRow) addressRow.style.display = 'none';
    if (addressInput) addressInput.required = false;
  } else {
    delivery.classList.add('active');
    pickup.classList.remove('active');

    hint.textContent =
      'Bezorging in Zwolle — € 2,50 bezorgkosten, gratis vanaf € 25,00. Gemiddeld binnen 45 minuten.';

    if (addressRow) addressRow.style.display = 'block';
    if (addressInput) addressInput.required = true;
  }

  renderCart();
  updateSteps();
}

function showStep(step) {
  const menuPicker = document.getElementById('menuPicker');
  const form = document.getElementById('customerForm');
  const confirm = document.getElementById('confirmView');
  const success = document.getElementById('successView');

  if (!menuPicker || !form || !confirm || !success) return;

  [menuPicker, form, confirm, success].forEach(el => {
    el.style.display = 'none';
  });

  if (step === 1) menuPicker.style.display = 'block';
  if (step === 2) form.style.display = 'block';
  if (step === 3) confirm.style.display = 'block';
  if (step === 4) success.style.display = 'block';

  updateSteps(step);
}

function updateSteps(step = 1) {
  const steps = [
    document.getElementById('step1'),
    document.getElementById('step2'),
    document.getElementById('step3')
  ];

  if (!steps[0]) return;

  steps.forEach((el, i) => {
    if (el) el.classList.toggle('active', i + 1 === step);
  });
}

function goToForm() {
  if (getCart().length === 0) {
    showToast('Je winkelmandje is nog leeg');
    return;
  }

  showStep(2);
}

function validateForm() {
  const name = document.getElementById('fName');
  const phone = document.getElementById('fPhone');
  const address = document.getElementById('fAddress');
  const err = document.getElementById('formError');

  if (!name || !phone || !address || !err) return false;

  if (name.value.trim().length < 2) {
    err.textContent = 'Vul je naam in.';
    return false;
  }

  if (phone.value.replace(/\D/g, '').length < 9) {
    err.textContent = 'Vul een geldig telefoonnummer in.';
    return false;
  }

  if (
    currentMode() === 'delivery' &&
    address.value.trim().length < 6
  ) {
    err.textContent = 'Vul je bezorgadres in.';
    return false;
  }

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
    html += `<li><span>${item.qty} × ${item.name}</span>
      <span>${formatPrice(item.price * item.qty)}</span></li>`;
  });

  html += `</ul>
    <div class="c-meta">
      <strong>${mode}</strong> · ${time}<br>
      ${name}${address && mode === 'Bezorgen' ? '<br>' + address : ''}
      ${notes ? '<br>Opmerking: ' + notes : ''}
    </div>
    <div class="c-total">
      <span>Totaal${mode === 'Bezorgen' && deliveryFee() === 0
        ? ' (gratis bezorgd)' : ''}</span>
      <span>${formatPrice(cartTotal())}</span>
    </div>`;

  document.getElementById('confirmSummary').innerHTML = html;
}

/* ---------- WhatsApp order ---------- */
function placeOrder() {
  const cart = getCart();

  if (cart.length === 0) {
    showToast('Je winkelmandje is nog leeg');
    showStep(1);
    return;
  }

  if (!validateForm()) {
    showStep(2);
    return;
  }

  const name = document.getElementById('fName').value.trim();
  const phone = document.getElementById('fPhone').value.trim();
  const time = document.getElementById('fTime').value;
  const address = document.getElementById('fAddress').value.trim();
  const notes = document.getElementById('fNotes').value.trim();
  const mode = currentMode() === 'delivery' ? 'Bezorging' : 'Afhalen';

  const subtotal = cartSubtotal();
  const fee = deliveryFee();
  const total = subtotal + fee;

  const orderNumber =
    'SZ-' + Math.floor(1000 + Math.random() * 9000);

  const lines = [
    '*NIEUWE BESTELLING — SOZING*',
    '',
    `Bestelnummer: ${orderNumber}`,
    `Naam: ${name}`,
    `Telefoon: ${phone}`,
    `Type: ${mode}`,
    `Gewenste tijd: ${time}`,
    '',
    '*Bestelde gerechten:*',
    ...cart.map(item =>
      `${item.qty}x ${item.name} — ${formatPrice(item.price * item.qty)}`
    ),
    '',
    `Subtotaal: ${formatPrice(subtotal)}`,
    `Bezorgkosten: ${fee === 0 ? 'Gratis' : formatPrice(fee)}`,
    `*Totaal: ${formatPrice(total)}*`,
    ...(mode === 'Bezorging' ? ['', `Bezorgadres: ${address}`] : []),
    ...(notes ? ['', `Opmerking: ${notes}`] : []),
    '',
    'Graag mijn bestelling bevestigen.'
  ];

  const whatsappUrl =
    'https://wa.me/' + WHATSAPP_NUMBER +
    '?text=' + encodeURIComponent(lines.join('\n'));

  // Open WhatsApp with the order prepared for the customer.
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

  // Show a message explaining that the customer must send it.
  document.getElementById('orderNumber').textContent = orderNumber;
  document.getElementById('successName').textContent = name;
  document.getElementById('successEta').textContent =
    'Je bestelling staat klaar in WhatsApp. Verstuur het bericht om je bestelling aan te vragen.';

  // Do not clear the cart here; WhatsApp may not have opened.
  showStep(4);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------- Contact form ---------- */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const name = document.getElementById('cName').value.trim();
    const email = document.getElementById('cEmail').value.trim();
    const msg = document.getElementById('cMessage').value.trim();
    const err = document.getElementById('contactError');

    if (name.length < 2) {
      err.textContent = 'Vul je naam in.';
      return;
    }

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      err.textContent = 'Vul een geldig e-mailadres in.';
      return;
    }

    if (msg.length < 5) {
      err.textContent = 'Schrijf een bericht.';
      return;
    }

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

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
  }

  /* Add-to-cart buttons */
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
    const deliveryBtn = document.getElementById('deliveryBtn');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const backToCart = document.getElementById('backToCart');
    const toConfirm = document.getElementById('toConfirm');
    const backToForm = document.getElementById('backToForm');
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    const newOrderBtn = document.getElementById('newOrderBtn');

    if (deliveryBtn) {
      deliveryBtn.addEventListener('click', () => setMode('delivery'));
    }

    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        goToForm();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    if (backToCart) {
      backToCart.addEventListener('click', () => {
        showStep(1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    if (toConfirm) {
      toConfirm.addEventListener('click', () => {
        if (!validateForm()) return;
        buildConfirmSummary();
        showStep(3);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    if (backToForm) {
      backToForm.addEventListener('click', () => {
        showStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    if (placeOrderBtn) {
      placeOrderBtn.addEventListener('click', placeOrder);
    }

    if (newOrderBtn) {
      newOrderBtn.addEventListener('click', () => {
        showStep(1);

        const orderForm = document.getElementById('orderForm');
        if (orderForm) orderForm.reset();

        setMode('pickup');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Start with pickup selected.
    setMode('pickup');
  }
});

/* ---------- Language switch buttons ---------- */
document.addEventListener('DOMContentLoaded', function () {
  const langNL = document.getElementById('langNL');
  const langEN = document.getElementById('langEN');

  if (!langNL || !langEN) return;

  function setLanguage(language) {
    document.documentElement.lang = language;

    langNL.classList.toggle('active', language === 'nl');
    langEN.classList.toggle('active', language === 'en');

    langNL.setAttribute('aria-pressed', String(language === 'nl'));
    langEN.setAttribute('aria-pressed', String(language === 'en'));

    localStorage.setItem('sozingLanguage', language);

    document.querySelectorAll('[data-nl][data-en]').forEach(element => {
      element.textContent =
        language === 'en'
          ? element.dataset.en
          : element.dataset.nl;
    });
  }

  langNL.addEventListener('click', () => setLanguage('nl'));
  langEN.addEventListener('click', () => setLanguage('en'));

  setLanguage(localStorage.getItem('sozingLanguage') || 'nl');
});
