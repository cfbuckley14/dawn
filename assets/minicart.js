const minicart = document.querySelector('[data-minicart]');
const closeButton = document.querySelector('[data-close-cart-trigger]');
const minicartUnderlay = document.querySelector('[data-minicart-underlay]');
const upsellsContainer = document.querySelector('[data-minicart-upsells]');

// format money helper function

const formatMoney = (price) => {
  return price / 100;
};

// update subtotal

const updateSubtotal = (cartData) => {
  const subtotalContainer = minicart.querySelector('[data-minicart-total]');
  if (!subtotalContainer) return;

  subtotalContainer.innerText = formatMoney(cartData.total_price);
};

// display cart items

const displayCartItems = (cartData) => {
  console.log(cartData);
  const cartItemsContainer = minicart.querySelector('.minicart__items');
  if (!cartItemsContainer) return;

  // Clear existing items
  cartItemsContainer.innerHTML = '';

  if (!cartData || !cartData.items || cartData.items.length === 0) {
    const emptyCartHTML = `
      <div class="minicart__empty">
        <h2>Looks like your cart is empty!</h2>
        <a href="/collections/all">Shop Here</a>
      </div>
    `;
    cartItemsContainer.innerHTML = emptyCartHTML;
    return;
  }

  if (cartData.items.length !== 0) {
    cartData.items.forEach((item) => {
      console.log(item);
      const innerHTML = `
        <div class="minicart__item" data-variant-id="${item.variant_id}">
          <img class="minicart-item__image" src="${item.image}" alt="${item.title}" />
          <div class="minicart-item__content">
            <h3 class="minicart-item__title">${item.title}</h3>
            <div class="minicart-item__price">£${formatMoney(item.price)}</div>
            <div class="minicart__item-actions">
              <div class="minicart__item-quantity">
                <span>Qty: ${item.quantity}</span>
              </div>
              <button 
                class="minicart__item-remove" 
                onclick='window.removeItemFromCart(${item.variant_id})'
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-remove" viewBox="0 0 16 16"><path fill="currentColor" d="M14 3h-3.53a3.07 3.07 0 0 0-.6-1.65C9.44.82 8.8.5 8 .5s-1.44.32-1.87.85A3.06 3.06 0 0 0 5.53 3H2a.5.5 0 0 0 0 1h1.25v10c0 .28.22.5.5.5h8.5a.5.5 0 0 0 .5-.5V4H14a.5.5 0 0 0 0-1M6.91 1.98c.23-.29.58-.48 1.09-.48s.85.19 1.09.48c.2.24.3.6.36 1.02h-2.9c.05-.42.17-.78.36-1.02m4.84 11.52h-7.5V4h7.5z"/><path fill="currentColor" d="M6.55 5.25a.5.5 0 0 0-.5.5v6a.5.5 0 0 0 1 0v-6a.5.5 0 0 0-.5-.5m2.9 0a.5.5 0 0 0-.5.5v6a.5.5 0 0 0 1 0v-6a.5.5 0 0 0-.5-.5"/></svg>
              </button>
            </div>
          </div>
        </div>
      `;
      cartItemsContainer.insertAdjacentHTML('beforeend', innerHTML);
    });
  }
};

// display upsells
const displayUpsells = (upsellProducts) => {
  const upsellsContainer = document.querySelector('[data-minicart-upsells]');
  if (!upsellsContainer || !upsellProducts) return;

  upsellsContainer.innerHTML = '';

  // Limit to first 3 products
  const limitedUpsells = upsellProducts.slice(0, 3);

  limitedUpsells.forEach((product) => {
    const upsellHTML = `
      <div class="minicart-upsell">
        <img 
          class="minicart-upsell__image" 
          src="${product.featured_image}" 
          alt="${product.title}" 
        />
        <div class="minicart-upsell__content">
          <h3 class="minicart-upsell__title">${product.title}</h3>
          <div class="minicart-upsell__price">${formatMoney(product.price)}</div>
          <button 
            class="minicart-upsell__add-button" 
            onclick="addToCart(${product.selected_or_first_available_variant.id})"
          >
            Add to Cart
          </button>
        </div>
      </div>
    `;
    upsellsContainer.insertAdjacentHTML('beforeend', upsellHTML);
  });
};

// fetch cart items using cart api

const fetchCartItems = async () => {
  if (!minicart) return;

  try {
    const response = await fetch(window.Shopify.routes.root + 'cart.js', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const cartData = await response.json();

    displayCartItems(cartData);
    updateSubtotal(cartData);

    return cartData;
  } catch (error) {
    console.error('Error:', error);
  }
};

// open minicart

const openMinicart = (event) => {
  if (!minicart) return;

  minicart.classList.add('is-open');
  minicartUnderlay.classList.add('is-open');

  event.preventDefault();

  fetchCartItems();
};

window.openMinicart = openMinicart;

// close minicart

const closeMinicart = (event) => {
  if (!minicart) return;

  minicart.classList.remove('is-open');
  minicart.classList.remove('is-open');

  event.preventDefault();
};

window.closeMinicart = closeMinicart;

// add item to cart

const addToCart = async (variantId, quantity = 1) => {
  if (!variantId) return;

  try {
    const response = await fetch(window.Shopify.routes.root + 'cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            id: parseInt(variantId, 10),
            quantity: quantity,
          },
        ],
      }),
    });

    const cartData = await response.json();

    // Open minicart
    minicart.classList.add('is-open');
    minicartUnderlay.classList.add('is-open');

    // Fetch and update cart contents
    await fetchCartItems();
  } catch (error) {
    console.error('Error adding item:', error);
  }
};

// remove item from cart

const removeItemFromCart = async (variantId) => {
  if (!variantId) return;

  try {
    const response = await fetch(window.Shopify.routes.root + 'cart/change.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: parseInt(variantId),
        quantity: 0,
      }),
    });

    const cartData = await response.json();

    // Update cart display
    displayCartItems(cartData);

    // Update subtotal
    const subtotalElement = minicart.querySelector('.minicart__subtotal-price');
    if (subtotalElement) {
      subtotalElement.textContent = formatMoney(cartData.total_price);
    }
  } catch (error) {
    console.error('Error removing item:', error);
  }
};

// Add to window object
window.removeItemFromCart = removeItemFromCart;
window.addToCart = addToCart;
