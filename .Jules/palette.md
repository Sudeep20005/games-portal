# Palette's Journal

## 2024-05-22 - Semantic HTML for Interactive Elements
**Learning:** The mobile menu toggle was implemented as a `div` element, making it inaccessible to keyboard users and screen readers. Standard HTML `<button>` elements should always be used for interactive controls to ensure native accessibility support (focus, key events, semantics).
**Action:** Audit all interactive elements (buttons, toggles) to ensure they use semantic HTML tags (`<button>`, `<a>`) or have appropriate ARIA roles and tabindex.
