// Mobile menu dropdown toggler
const mobileToggleBtn = document.getElementById('mobile-menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');

mobileToggleBtn.addEventListener('click', () => {
  mobileMenu.classList.toggle('hidden');
});

// Theme Toggler Implementation
const themeToggleBtn = document.getElementById('theme-toggle');
const sunIcon = document.getElementById('sun-icon');
const moonIcon = document.getElementById('moon-icon');

function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark');
    document.documentElement.classList.add('dark');
    sunIcon.classList.add('hidden');
    moonIcon.classList.remove('hidden');
  } else {
    document.body.classList.remove('dark');
    document.documentElement.classList.remove('dark');
    sunIcon.classList.remove('hidden');
    moonIcon.classList.add('hidden');
  }
}

themeToggleBtn.addEventListener('click', () => {
  const activeTheme = document.body.classList.contains('dark') ? 'light' : 'dark';
  applyTheme(activeTheme);
  localStorage.setItem('freshbites-theme', activeTheme);
});

// Initialize Theme - Defaults to bright, light theme colors if no preference is set
const savedTheme = localStorage.getItem('freshbites-theme') || 'light';
applyTheme(savedTheme);


// Interactive Order Processing Setup
let cart = [];

// Make functions globally accessible so inline HTML onclick attributes find them
window.addToCart = function(id, name, price) {
  const existingIndex = cart.findIndex(item => item.id === id);
  if (existingIndex > -1) {
    cart[existingIndex].quantity += 1;
  } else {
    cart.push({ id, name, price, quantity: 1 });
  }
  updateCartUI();

  // Smooth scroll down to checkout card container when adding item
  document.getElementById('order').scrollIntoView({ behavior: 'smooth' });
}

window.adjustQuantity = function(id, delta) {
  const targetIndex = cart.findIndex(item => item.id === id);
  if (targetIndex > -1) {
    cart[targetIndex].quantity += delta;
    if (cart[targetIndex].quantity <= 0) {
      cart.splice(targetIndex, 1);
    }
  }
  updateCartUI();
}

function updateCartUI() {
  const cartItemsEl = document.getElementById('cart-items');
  const emptyStateEl = document.getElementById('cart-empty-state');
  const summaryCalculationsEl = document.getElementById('cart-summary');
  const orderBtn = document.getElementById('place-order-btn');

  // Reset Success Banners if user alters cart items
  document.getElementById('success-alert').classList.add('hidden');

  if (cart.length === 0) {
    cartItemsEl.classList.add('hidden');
    emptyStateEl.classList.remove('hidden');
    summaryCalculationsEl.classList.add('hidden');
    orderBtn.disabled = true;
    orderBtn.classList.add('opacity-50', 'cursor-not-allowed');
    return;
  }

  // Toggle Container Visibility
  emptyStateEl.classList.add('hidden');
  cartItemsEl.classList.remove('hidden');
  summaryCalculationsEl.classList.remove('hidden');
  orderBtn.disabled = false;
  orderBtn.classList.remove('opacity-50', 'cursor-not-allowed');

  // Rebuild lists
  cartItemsEl.innerHTML = '';
  let subtotal = 0;

  cart.forEach(item => {
    const lineCost = item.price * item.quantity;
    subtotal += lineCost;

    const itemRow = document.createElement('div');
    itemRow.className = 'flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700 transition-colors';
    itemRow.innerHTML = `
      <div class="pr-3">
        <h4 class="font-semibold text-gray-800 dark:text-gray-100 text-sm md:text-base">${item.name}</h4>
        <span class="text-xs text-gray-500 dark:text-gray-400">$${item.price.toFixed(2)} each</span>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="adjustQuantity(${item.id}, -1)" class="w-7 h-7 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full flex items-center justify-center font-bold text-gray-700 dark:text-gray-200 transition">-</button>
        <span class="font-semibold text-gray-800 dark:text-gray-100 text-sm w-4 text-center">${item.quantity}</span>
        <button onclick="adjustQuantity(${item.id}, 1)" class="w-7 h-7 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full flex items-center justify-center font-bold text-gray-700 dark:text-gray-200 transition">+</button>
        <span class="w-16 text-right font-bold text-gray-800 dark:text-gray-100 text-sm">$${lineCost.toFixed(2)}</span>
      </div>
    `;
    cartItemsEl.appendChild(itemRow);
  });

  const shippingCharge = subtotal >= 50.00 ? 0.00 : 4.99;
  const taxCharge = subtotal * 0.0825;
  const totalPayable = subtotal + shippingCharge + taxCharge;

  document.getElementById('subtotal').innerText = `$${subtotal.toFixed(2)}`;
  document.getElementById('delivery-fee').innerText = shippingCharge === 0.00 ? 'FREE' : `$${shippingCharge.toFixed(2)}`;
  document.getElementById('tax').innerText = `$${taxCharge.toFixed(2)}`;
  document.getElementById('grand-total').innerText = `$${totalPayable.toFixed(2)}`;
}

window.submitOrder = function(e) {
  e.preventDefault();

  const nameVal = document.getElementById('cust-name').value.trim();
  const phoneVal = document.getElementById('cust-phone').value.trim();
  const addressVal = document.getElementById('cust-address').value.trim();

  if (!nameVal || !phoneVal || !addressVal || cart.length === 0) return;

  // Change checkout button state to processing
  const orderBtn = document.getElementById('place-order-btn');
  orderBtn.disabled = true;
  orderBtn.innerText = "Processing Payment...";

  // Simulate payment delay for Stripe mock verification
  setTimeout(() => {
    const successModal = document.getElementById('success-modal');
    if (successModal) {
      successModal.classList.remove('hidden');
    }
  }, 2000);
}

// Function to handle modal closure and UI reset
window.closeSuccessModal = function() {
  const successModal = document.getElementById('success-modal');
  if (successModal) {
    successModal.classList.add('hidden');
  }

  // Clear shopping cart array and trigger UI updates
  cart = [];
  updateCartUI();

  // Reset checkout form inputs
  const checkoutForm = document.getElementById('checkout-form');
  if (checkoutForm) {
    checkoutForm.reset();
  }

  // Restore checkout button style and content
  const orderBtn = document.getElementById('place-order-btn');
  if (orderBtn) {
    orderBtn.disabled = false;
    orderBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      Place Your Delivery Order
    `;
  }
}

