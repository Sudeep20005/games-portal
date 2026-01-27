## 2024-05-22 - Semantic Mobile Menu
**Learning:** Replacing `<div>` triggers with `<button>` elements immediately improves keyboard accessibility (tab focus) and allows for proper ARIA state management (`aria-expanded`).
**Action:** Always implement interactive toggles as `<button>` elements with `aria-expanded` and `aria-controls` attributes, using CSS resets to maintain visual design if needed.
