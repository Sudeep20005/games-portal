## 2024-05-23 - Duplicate Header Architecture
**Learning:** The website relies on duplicated HTML header/navigation across all pages (`index.html`, `games.html`, `about.html`, etc.).
**Action:** Any global header change (like this mobile menu fix) must be manually replicated across all HTML files.

## 2024-05-23 - Button Semantic Replacement
**Learning:** Replacing interactive `<div>` elements with `<button>` tags requires explicit CSS resets (`background: transparent; border: none; padding: 0; font-family: inherit;`) to preserve the existing visual design.
**Action:** Always include these resets in the CSS class when semanticizing UI elements.
