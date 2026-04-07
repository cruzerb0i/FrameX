// Mock Data
const products = [
  { id: 'p1', title: 'Neon Nights Poster', price: 250, category: 'posters', image: 'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?auto=format&fit=crop&w=400&q=80', badge: 'Trending' },
  { id: 'p2', title: 'Minimalist Tokyo Frame', price: 450, category: 'frames', image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=400&q=80' },
  { id: 'p3', title: 'Cyberpunk Sticker Pack', price: 90, category: 'stickers', image: 'https://images.unsplash.com/photo-1572375992501-4b0892d50c69?auto=format&fit=crop&w=400&q=80', badge: 'Hot' },
  { id: 'p4', title: 'Abstract Waves Poster', price: 220, category: 'posters', image: 'https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=400&q=80' },
  { id: 'p5', title: 'Premium Oak Frame', price: 500, category: 'frames', image: 'https://images.unsplash.com/photo-1582560475093-ba66accbc424?auto=format&fit=crop&w=400&q=80' },
  { id: 'p6', title: 'Retro Gaming Stickers', price: 110, category: 'stickers', image: 'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?auto=format&fit=crop&w=400&q=80' }
];

// App State
const state = {
  cart: [],
  currentView: 'home',
  customBuilder: {
    image: null,
    size: 'A4',
    frameColor: '#000000',
    price: 350
  }
};

// Pricing rules for builder
const buildPricing = {
  sizes: { 'A4': 0, 'A3': 100, 'A2': 250 },
  base: 350
};

// Core Application Logic
const app = {
  init() {
    this.renderFeaturedProducts();
    this.renderShopProducts();
    this.setupNavigation();
    this.setupCart();
    this.setupBuilder();
    this.setupCheckout();
    
    // Check hash URL on load
    if (window.location.hash) {
      this.navigate(window.location.hash.substring(1));
    }
  },

  navigate(viewId) {
    const views = document.querySelectorAll('.view');
    views.forEach(v => v.classList.remove('active'));
    
    const target = document.getElementById(`view-${viewId}`);
    if (target) {
      target.classList.add('active');
      window.scrollTo(0, 0);
      state.currentView = viewId;
      window.history.pushState(null, null, `#${viewId}`);
      
      if(viewId === 'checkout') {
        this.renderCheckoutSummary();
      }
    }
  },

  setupNavigation() {
    window.addEventListener('popstate', () => {
      const hash = window.location.hash.substring(1);
      if (hash) this.navigate(hash);
      else this.navigate('home');
    });

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
      const nav = document.getElementById('navbar');
      if (window.scrollY > 50) nav.style.padding = '0';
      else nav.style.padding = '10px 0';
    });

    // Logo click
    document.querySelector('.logo').addEventListener('click', () => this.navigate('home'));
  },

  // Products & Shop
  renderFeaturedProducts() {
    const container = document.getElementById('featured-products');
    if(!container) return;
    const featured = products.slice(0, 3); // top 3
    container.innerHTML = featured.map(p => this.productCardHTML(p)).join('');
  },

  renderShopProducts(category = 'all') {
    const container = document.getElementById('shop-products');
    if(!container) return;
    const filtered = category === 'all' ? products : products.filter(p => p.category === category);
    container.innerHTML = filtered.map(p => this.productCardHTML(p)).join('');

    // Setup filter buttons
    document.querySelectorAll('.btn-filter').forEach(btn => {
      btn.classList.remove('active');
      if(btn.dataset.cat === category) btn.classList.add('active');
      
      // Remove old listeners to avoid multiple triggers, then add fresh
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      newBtn.addEventListener('click', (e) => this.renderShopProducts(e.target.dataset.cat));
    });
  },

  productCardHTML(product) {
    const badgeHtml = product.badge ? `<span class="badge badge-hot" style="position:absolute; top:10px; left:10px; z-index:2;">${product.badge}</span>` : '';
    return `
      <div class="product-card">
        ${badgeHtml}
        <img src="${product.image}" loading="lazy" class="product-img" alt="${product.title}">
        <div class="product-info">
          <h3 class="product-title">${product.title}</h3>
          <div class="product-price">EGP ${product.price}</div>
          <button class="btn btn-secondary w-full" onclick="app.addToCart('${product.id}')">Quick Add</button>
        </div>
      </div>
    `;
  },

  // Cart
  setupCart() {
    document.getElementById('open-cart').addEventListener('click', () => this.toggleCart(true));
    document.getElementById('close-cart').addEventListener('click', () => this.toggleCart(false));
    document.getElementById('cart-drawer-overlay').addEventListener('click', () => this.toggleCart(false));
    
    document.getElementById('btn-to-checkout').addEventListener('click', () => {
      if(state.cart.length === 0) {
        this.showToast('Your cart is empty!');
        return;
      }
      this.toggleCart(false);
      this.navigate('checkout');
    });
  },

  addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const cartItem = {
      cartId: Date.now().toString(),
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      isCustom: false
    };
    
    state.cart.push(cartItem);
    this.updateCartUI();
    this.showToast(`EGP ${product.price} | ${product.title} added`);
  },

  addCustomToCart() {
    if(!state.customBuilder.image) {
      this.showToast('Please upload an image first!');
      return;
    }
    const cartItem = {
      cartId: Date.now().toString(),
      id: 'custom-' + Date.now(),
      title: `Custom Design (${state.customBuilder.size})`,
      price: state.customBuilder.price,
      image: state.customBuilder.image, // base64 or blob
      isCustom: true,
      meta: `Frame: ${state.customBuilder.frameColor === '#000000' ? 'Black' : state.customBuilder.frameColor === '#ffffff' ? 'White' : 'Gold'}`
    };
    
    state.cart.push(cartItem);
    this.updateCartUI();
    this.showToast('Custom item added to cart!');
    this.toggleCart(true);
  },

  removeFromCart(cartId) {
    state.cart = state.cart.filter(item => item.cartId !== cartId);
    this.updateCartUI();
    
    if(state.currentView === 'checkout') {
      this.renderCheckoutSummary();
    }
  },

  updateCartUI() {
    // Badge
    document.getElementById('cart-badge').textContent = state.cart.length;
    
    // Items
    const container = document.getElementById('cart-items-container');
    if(state.cart.length === 0) {
      container.innerHTML = '<p style="color:#888; text-align:center; padding: 20px 0;">Cart is styling its way to emptiness.</p>';
    } else {
      container.innerHTML = state.cart.map(item => `
        <div class="cart-item">
          <img src="${item.image}" alt="item">
          <div class="cart-item-details">
            <div class="cart-item-title">${item.title}</div>
            ${item.meta ? `<div class="cart-item-meta">${item.meta}</div>` : ''}
            <div class="cart-item-price">EGP ${item.price}</div>
            <button class="remove-item" onclick="app.removeFromCart('${item.cartId}')">Remove</button>
          </div>
        </div>
      `).join('');
    }

    // Total
    const total = state.cart.reduce((sum, item) => sum + item.price, 0);
    document.getElementById('cart-total-price').textContent = `EGP ${total}`;
    document.getElementById('cart-count').textContent = `(${state.cart.length})`;
    
    // Mobile sticky cart
    const stickyCart = document.getElementById('mobile-sticky-cart');
    const stickyCount = document.getElementById('sticky-cart-count');
    const stickyTotal = document.getElementById('sticky-cart-total');
    if(state.cart.length > 0) {
      stickyCart.classList.remove('hidden');
      setTimeout(() => stickyCart.classList.add('visible'), 10);
      stickyCount.textContent = `${state.cart.length} item${state.cart.length > 1 ? 's' : ''}`;
      stickyTotal.textContent = `EGP ${total}`;
    } else {
      stickyCart.classList.remove('visible');
      setTimeout(() => stickyCart.classList.add('hidden'), 300);
    }
  },

  toggleCart(show) {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-drawer-overlay');
    if (show) {
      drawer.classList.add('open');
      overlay.classList.add('open');
    } else {
      drawer.classList.remove('open');
      overlay.classList.remove('open');
    }
  },

  // Builder
  setupBuilder() {
    const upload = document.getElementById('custom-image-upload');
    const sizeSelect = document.getElementById('custom-size');
    const colorBtns = document.querySelectorAll('.color-btn');
    const addBtn = document.getElementById('custom-add-to-cart');
    
    upload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          state.customBuilder.image = event.target.result;
          this.updateBuilderPreview();
        };
        reader.readAsDataURL(file);
      }
    });

    sizeSelect.addEventListener('change', (e) => {
      state.customBuilder.size = e.target.value;
      this.updateBuilderPrice();
    });

    colorBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        colorBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        state.customBuilder.frameColor = e.target.dataset.color;
        this.updateBuilderPreview();
      });
    });

    addBtn.addEventListener('click', () => this.addCustomToCart());
  },

  updateBuilderPreview() {
    const frame = document.getElementById('preview-frame-el');
    const inner = frame.querySelector('.preview-inner');
    
    // Update color
    frame.style.background = state.customBuilder.frameColor;
    if(state.customBuilder.frameColor === '#ffffff') {
      frame.style.border = '1px solid #ddd';
    } else {
      frame.style.border = 'none';
    }
    
    // Update image
    if (state.customBuilder.image) {
      inner.innerHTML = `<img src="${state.customBuilder.image}" alt="Custom Art">`;
    }
  },

  updateBuilderPrice() {
    const base = buildPricing.base;
    const addOn = buildPricing.sizes[state.customBuilder.size] || 0;
    state.customBuilder.price = base + addOn;
    document.getElementById('custom-price').textContent = state.customBuilder.price;
  },

  // Checkout
  setupCheckout() {
    const form = document.getElementById('checkout-form');
    const methodSelect = document.getElementById('payment-method');
    const vfInstructions = document.getElementById('vf-instructions');

    methodSelect.addEventListener('change', (e) => {
      if(e.target.value === 'vodafone' || e.target.value === 'instapay') {
        vfInstructions.classList.remove('hidden');
        if(e.target.value === 'vodafone') vfInstructions.innerHTML = '<p>Send amount to <strong>010XXXXXXXX</strong> via VF Cash.</p>';
        if(e.target.value === 'instapay') vfInstructions.innerHTML = '<p>Send amount to <strong>framex@instapay</strong>.</p>';
      } else {
        vfInstructions.classList.add('hidden');
      }
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if(state.cart.length === 0) {
        this.showToast('Please add items to cart first.');
        return;
      }
      
      // Mock Submission
      document.querySelector('.checkout-layout').innerHTML = `
        <div class="glass-panel" style="padding: 60px; text-align:center; grid-column: 1/-1;">
          <h2 style="font-size: 3rem; margin-bottom: 20px;" class="text-accent">ORDER CONFIRMED!</h2>
          <p>Thank you for upgrading your vibe with Frame X.</p>
          <p>Your order is being processed and will be delivered within Egypt in 3-5 days.</p>
          <button class="btn btn-primary" style="margin-top: 30px;" onclick="window.location.reload()">Back to Home</button>
        </div>
      `;
      state.cart = [];
      this.updateCartUI();
    });
  },

  renderCheckoutSummary() {
    const list = document.getElementById('checkout-items-list');
    const sub = document.getElementById('chk-subtotal');
    const tot = document.getElementById('chk-total');

    if(state.cart.length === 0) {
      list.innerHTML = '<p>No items.</p>';
      sub.textContent = 'EGP 0';
      tot.textContent = 'EGP 0';
      return;
    }

    list.innerHTML = state.cart.map(item => `
      <div class="checkout-item">
        <span>${item.title}</span>
        <span>EGP ${item.price}</span>
      </div>
    `).join('');

    const subtotal = state.cart.reduce((s, i) => s + i.price, 0);
    const shipping = 45; // Fixed EGP 45 shipping
    sub.textContent = `EGP ${subtotal}`;
    tot.textContent = `EGP ${subtotal + shipping}`;
  },

  // Utils
  showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideInRight 0.3s reverse forwards';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
