/*
 * cart.js
 *
 * Lightweight client‑side shopping cart for Alba Space shop pages.  The cart
 * persists to `localStorage` so that the contents survive page reloads.  It
 * supports multiple variants of a product (e.g. size, colour) by storing
 * additional attributes on each cart entry.  A global `cartManager` object
 * exposes methods for reading and writing the cart, updating quantities and
 * badges, and manipulating individual entries.  Elements that show the cart
 * count should use the `[data-cart-count]` attribute, or the legacy class
 * `.cart-count` for backward compatibility.
 */

(function () {
  const CART_KEY = 'alba_space_cart_v1';

  /**
   * Load the cart from localStorage.  If nothing is stored this returns
   * an empty array.  Each item has the shape:
   *   {
   *     id: string,
   *     name: string,
   *     price: number,
   *     image: string,
   *     url: string,
   *     size?: string,
   *     color?: string,
   *     qty: number
   *   }
   *
   * @returns {Array<Object>} The current cart.
   */
  function load() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.warn('Cart parse error', err);
      return [];
    }
  }

  /**
   * Persist the cart back to localStorage.
   *
   * @param {Array<Object>} cart The cart to save.
   */
  function save(cart) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (err) {
      console.warn('Cart save error', err);
    }
  }

  /**
   * Compute the total number of items in the cart by summing the qty
   * property of each entry.
   *
   * @param {Array<Object>} [cart] Optional cart array to count.  If
   *   omitted, the current cart is loaded from storage.
   * @returns {number} Total quantity of items.
   */
  function getTotalCount(cart) {
    const items = cart || load();
    return items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  }

  /**
   * Update all on‑page badges that display the cart item count.  Elements
   * annotated with `data-cart-count` or the class `cart-count` will have
   * their text content replaced with the computed total.
   */
  function updateBadge() {
    const total = getTotalCount();
    document.querySelectorAll('[data-cart-count], .cart-count').forEach(el => {
      el.textContent = String(total);
    });
  }

  /**
   * Add a new entry to the cart.  If an existing entry matches the new
   * item on `id`, `size` and `color`, its quantity is incremented by
   * `item.qty`.  Otherwise a new entry is appended.  After updating, the
   * cart is persisted and badges are refreshed.
   *
   * @param {Object} item The item to add.  Must include id, name, price,
   *   image, url and qty.  Optional: size, color.
   */
  function addItem(item) {
    const cart = load();
    const matchIndex = cart.findIndex(entry => {
      return entry.id === item.id && entry.size === item.size && entry.color === item.color;
    });
    if (matchIndex >= 0) {
      cart[matchIndex].qty += item.qty;
    } else {
      cart.push({ ...item });
    }
    save(cart);
    updateBadge();
  }

  /**
   * Update the quantity for an entry at the given index.  If the new
   * quantity is less than 1, the entry is removed.  Returns the
   * updated cart array.
   *
   * @param {number} index Position of the item in the cart array.
   * @param {number} qty New quantity value.
   * @returns {Array<Object>} The updated cart.
   */
  function updateQty(index, qty) {
    const cart = load();
    if (index < 0 || index >= cart.length) return cart;
    const newQty = Number(qty);
    if (newQty <= 0) {
      cart.splice(index, 1);
    } else {
      cart[index].qty = newQty;
    }
    save(cart);
    updateBadge();
    return cart;
  }

  /**
   * Remove the entry at the given index from the cart.  Returns the
   * updated cart array.
   *
   * @param {number} index Position of the item to remove.
   * @returns {Array<Object>} The updated cart.
   */
  function remove(index) {
    const cart = load();
    if (index < 0 || index >= cart.length) return cart;
    cart.splice(index, 1);
    save(cart);
    updateBadge();
    return cart;
  }

  // Expose the API globally
  window.cartManager = {
    load,
    save,
    getTotalCount,
    updateBadge,
    addItem,
    updateQty,
    remove
  };

  // Update badges when the page loads
  // When the document loads, update cart badges and inject the cart icon into
  // the header if it hasn't been added yet.  The site header is loaded via
  // include.js, so we wait until DOMContentLoaded to find it.  The cart link
  // is appended to the element with class `.header-social`, which contains
  // existing social icons.  We compute the link destination based on the
  // current page language: for pages with `lang="tr"` we link to the
  // Turkish cart page (/tr/cart.html); otherwise we link to the English
  // cart page (/eng/cart.html).
  document.addEventListener('DOMContentLoaded', () => {
    updateBadge();
    try {
      const headerSocial = document.querySelector('.header-social');
      if (headerSocial && !document.querySelector('.header-cart-link')) {
        const lang = document.documentElement.lang || 'en';
        const cartUrl = lang.toLowerCase().startsWith('tr') ? '/tr/cart.html' : '/eng/cart.html';
        const link = document.createElement('a');
        link.href = cartUrl;
        link.className = 'header-cart-link';
        // build inner HTML with SVG icon and badge
        link.innerHTML =
          `<span class="header-cart-icon" style="position:relative;display:inline-block;">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path d="M7 7V6a5 5 0 0 1 10 0v1h2a1 1 0 0 1 .99 1.14l-1.6 11A2 2 0 0 1 16.41 21H7.59a2 2 0 0 1-1.98-1.86l-1.6-11A1 1 0 0 1 4 7h3zm2 0h6V6a3 3 0 0 0-6 0v1z" fill="currentColor"></path>
            </svg>
            <span class="header-cart-count" data-cart-count style="position:absolute;top:-6px;right:-8px;min-width:16px;padding:1px 4px;border-radius:999px;background:var(--accent, #00c2ff);color:var(--header-bg, #020617);font-size:11px;font-weight:600;line-height:1.2;text-align:center;">
              0
            </span>
          </span>`;
        headerSocial.appendChild(link);
      }
    } catch (err) {
      console.warn('Cart icon injection failed:', err);
    }
  });
})();