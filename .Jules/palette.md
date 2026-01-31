## 2024-05-22 - Static Site Duplication & Semantics
**Learning:** The site relies on manual duplication of HTML headers across all pages. This makes applying global accessibility fixes (like converting `div` toggles to `button`) error-prone and tedious.
**Action:** When applying navigation fixes, ensure every single HTML file is updated. Consider suggesting a template system or JS-based header injection for future major refactors.

## 2024-05-22 - Semantic Button Reset
**Learning:** Converting legacy `div` toggles to `<button>` elements requires explicit CSS resets (`background: transparent; border: none; padding: 0; font-family: inherit;`) to match the existing design without visual regression.
**Action:** Always include this reset block when semanticizing custom interactive elements in this codebase.
