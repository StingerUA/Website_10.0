/**
 * Mobile Header: Cart icon repositioning [DEPRECATED]
 * 
 * NOTE: This script is now deprecated. The cart icon has been moved directly into the HTML
 * structure as the first child of .logo-sub-icons, so no JavaScript repositioning is needed.
 * 
 * The CSS in fix-layout.css handles:
 * - Hiding the cart from top-lang-switch on mobile
 * - Displaying the cart in logo-sub-icons with proper styling
 * - Maintaining proper layout on desktop (hidden since it's the first element)
 * 
 * Keeping this file for backwards compatibility and reference.
 */

function repositionCartIconOnMobile() {
  // This function is no longer needed - cart is positioned in HTML directly
  // Keeping for reference and backwards compatibility only
  console.debug('repositionCartIconOnMobile: Deprecated - cart is now positioned in HTML');
}

// Run when DOM is ready (no-op now)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', repositionCartIconOnMobile);
} else {
  repositionCartIconOnMobile();
}
