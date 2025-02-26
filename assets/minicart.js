const minicart = document.querySelector('[data-minicart]');
const closeButton = document.querySelector('[data-close-cart-trigger]');
const minicartUnderlay = document.querySelector('[data-minicart-underlay]');
const upsellsContainer = document.querySelector('[data-minicart-upsells]');
const shopHereLangString = minicart.dataset.minicartShopHereLangString;
const emptyCartLangString = minicart.dataset.minicartEmptyCartLangString;

// helper functions

const formatMoney = (price) => {
  return '£' + (price / 100).toFixed(2);
};

const updateSubtotal = (cartData) => {
  const subtotalElement = minicart.querySelector('[data-minicart-total]');
  if (subtotalElement) {
    subtotalElement.textContent = formatMoney(cartData.total_price);
  }
};

// display cart items
const displayCartItems = (cartData) => {
  const cartItemsContainer = minicart.querySelector('.minicart__items');
  if (!cartItemsContainer) return;

  // Get the language strings from data attributes
  const shopHereString = JSON.parse(minicart.dataset.minicartShopHereString);

  // Clear existing items
  cartItemsContainer.innerHTML = '';

  if (!cartData || !cartData.items || cartData.items.length === 0) {
    const emptyCartHTML = `
      <div class="minicart__empty">
        <p>${minicart.dataset.minicartEmptyCartString}</p>
        ${shopHereString}
      </div>
    `;
    cartItemsContainer.innerHTML = emptyCartHTML;
    return;
  }

  if (cartData.items.length !== 0) {
    cartData.items.forEach((item) => {
      const innerHTML = `
        <div class="minicart__item" data-variant-id="${item.variant_id}">
          <img class="minicart__item--image" src="${item.image}" alt="${item.title}" />
          <div class="minicart__item--content">
            <h3 class="minicart__item--title">${item.title}</h3>
            <div class="minicart__item--price">${formatMoney(item.price)}</div>
            <div class="minicart__item--actions">
              <div class="minicart__item--quantity">
                <span>Qty: ${item.quantity}</span>
              </div>
              <button 
                class="minicart__item--remove" 
                onclick="removeItemFromCart('${item.key}')"
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

const toggleMinicartSections = (cartData) => {
  const upsellsSection = minicart.querySelector('[data-minicart-upsells]');
  const footerSection = minicart.querySelector('[data-minicart-footer]');

  if (!cartData || !cartData.items || cartData.items.length === 0) {
    upsellsSection?.classList.add('hidden');
    footerSection?.classList.add('hidden');
  } else {
    upsellsSection?.classList.remove('hidden');
    footerSection?.classList.remove('hidden');
  }
};

const populateUpsells = async () => {
  try {
    // Get all products
    const response = await fetch(window.Shopify.routes.root + 'products.json?limit=250');
    const data = await response.json();

    // Get current cart items to exclude them from upsells
    const cartResponse = await fetch(window.Shopify.routes.root + 'cart.js');
    const cartData = await cartResponse.json();
    const cartVariantIds = cartData.items.map((item) => item.variant_id.toString());

    // Filter qualifying products
    const qualifyingProducts = data.products
      .filter(
        (product) =>
          product.variants.length === 1 &&
          product.variants[0].price < 2000 &&
          !cartVariantIds.includes(product.variants[0].id.toString())
      )
      // Randomize the order
      .sort(() => Math.random() - 0.5);

    const upsellContainer = document.querySelector('[data-minicart-upsells-items]');
    const upsellSection = document.querySelector('[data-minicart-upsells]');

    if (!upsellContainer || !upsellSection) return;

    // Clear existing upsells
    upsellContainer.innerHTML = '';

    // If no qualifying products, hide the upsells section
    if (qualifyingProducts.length === 0) {
      upsellSection.classList.add('hidden');
      return;
    }

    // Show upsells section
    upsellSection.classList.remove('hidden');

    // Take up to 3 products (or fewer if less are available)
    const productsToShow = qualifyingProducts.slice(0, 3);

    // Add new upsells
    productsToShow.forEach((product) => {
      const upsellHTML = `
        <div class="minicart__upsell-item" data-variant-id="${product.variants[0].id}">
          <img
            width="100"
            height="100"
            class="minicart__upsell-image"
            src="${product.images && product.images[0] ? product.images[0].src : ''}"
            alt="${product.title}"
          >
          <div class="minicart__upsell-content">
            <h3 class="minicart__upsell-title">${product.title}</h3>
            <div class="minicart__upsell-actions">
              <div class="minicart__upsell-price">£${product.variants[0].price}</div>
              <button
                class="minicart__upsell-add"
                data-add-to-cart
                onclick="window.addToCart(${product.variants[0].id})"
              >
                Add to bag
              </button>
            </div>
          </div>
        </div>
      `;
      upsellContainer.insertAdjacentHTML('beforeend', upsellHTML);
    });
  } catch (error) {
    console.error('Error populating upsells:', error);
    // Hide upsells section in case of error
    const upsellSection = document.querySelector('[data-minicart-upsells]');
    upsellSection?.classList.add('hidden');
  }
};

// fetch cart items using cart api
const fetchCartItems = async (shouldUpdateUpsells = false) => {
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
    toggleMinicartSections(cartData);

    // Only update upsells if specifically requested
    if (shouldUpdateUpsells) {
      populateUpsells();
    }

    return cartData;
  } catch (error) {
    console.error('Error:', error);
  }
};

// open minicart
const openMinicart = (event) => {
  if (!minicart) return;

  document.body.classList.add('minicart-open');
  minicart.classList.add('is-open');
  minicartUnderlay.classList.add('is-open');

  console.log(minicart.dataset);

  if (event) {
    event.preventDefault();
  }

  fetchCartItems(false); // Don't update upsells when opening cart
};

window.openMinicart = openMinicart;

// close minicart
const closeMinicart = (event) => {
  if (!minicart) return;

  document.body.classList.remove('minicart-open');
  minicart.classList.remove('is-open');
  minicartUnderlay.classList.remove('is-open');

  event.preventDefault();
};

window.closeMinicart = closeMinicart;

const replaceUpsellProduct = async (addedVariantId) => {
  try {
    // Get current upsell variant IDs
    const upsellContainer = document.querySelector('[data-minicart-upsells-items]');
    if (!upsellContainer) {
      console.error('Upsell container not found');
      return;
    }

    const currentUpsells = Array.from(upsellContainer.querySelectorAll('[data-variant-id]')).map(
      (el) => el.dataset.variantId
    );

    // If the added variant wasn't from upsells, no need to replace anything
    if (!currentUpsells.includes(addedVariantId.toString())) {
      console.log('Added product was not from upsells, skipping replacement');
      return;
    }

    // Get all products
    const response = await fetch(window.Shopify.routes.root + 'products.json?limit=250');
    const data = await response.json();

    // Get current cart items to exclude them
    const cartResponse = await fetch(window.Shopify.routes.root + 'cart.js');
    const cartData = await cartResponse.json();
    const cartVariantIds = cartData.items.map((item) => item.variant_id.toString());

    // Remove the added product's upsell
    const addedUpsell = upsellContainer.querySelector(`[data-variant-id="${addedVariantId.toString()}"]`);
    if (!addedUpsell) {
      console.log('Could not find upsell element to replace');
      return;
    }

    // Find a new product that meets our criteria
    const newProduct = data.products.find((product) => {
      // Check if product has single variant and costs less than £20
      if (product.variants.length !== 1 || product.variants[0].price > 2000) return false;

      const variantId = product.variants[0].id.toString();
      // Ensure product isn't already shown in upsells and isn't in cart
      return !currentUpsells.includes(variantId) && !cartVariantIds.includes(variantId);
    });

    if (!newProduct) {
      console.log('No qualifying replacement product found');
      return;
    }

    // Create and insert new upsell HTML
    const newUpsellHTML = `
      <div class="minicart__upsell-item" data-variant-id="${newProduct.variants[0].id}">
        <img
          width="100"
          height="100"
          class="minicart__upsell-image"
          src="${newProduct.images && newProduct.images[0] ? newProduct.images[0].src : ''}"
          alt="${newProduct.title}"
        >
        <div class="minicart__upsell-content">
          <h3 class="minicart__upsell-title">${newProduct.title}</h3>
          <div class="minicart__upsell-actions">
            <div class="minicart__upsell-price">£${newProduct.variants[0].price}</div>
            <button
              class="minicart__upsell-add"
              data-add-to-cart
              onclick="window.addToCart(${newProduct.variants[0].id})"
            >
              Add to bag
            </button>
          </div>
        </div>
      </div>
    `;

    // Insert new upsell and remove old one
    addedUpsell.insertAdjacentHTML('afterend', newUpsellHTML);
    addedUpsell.remove();
  } catch (error) {
    console.error('Error replacing upsell:', error);
  }
};

// Update the addToCart function
const addToCart = async (variantId) => {
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
            quantity: 1,
          },
        ],
      }),
    });

    if (response.ok) {
      await fetchCartItems(false); // Don't update all upsells
      await replaceUpsellProduct(variantId); // Only replace the specific upsell if needed
      openMinicart();
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
  }
};

window.addToCart = addToCart;

// remove item from cart
const removeItemFromCart = async (variantKey) => {
  if (!variantKey) return;

  const updates = {
    [variantKey]: 0,
  };

  try {
    const response = await fetch(window.Shopify.routes.root + 'cart/update.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ updates }),
    });

    const cartData = await response.json();
    await fetchCartItems(false); // Don't update upsells when removing items
    updateSubtotal(cartData);
  } catch (error) {
    console.error('Error removing item:', error);
  }
};

window.removeItemFromCart = removeItemFromCart;

// Initial population of upsells when the page loads
document.addEventListener('DOMContentLoaded', () => {
  populateUpsells();
});
