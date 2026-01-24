## 2024-05-22 - Mobile Menu Accessibility
**Learning:** Converting `div` based toggles to semantic `<button>` elements provides immediate keyboard and screen reader support (focus, enter/space activation) but requires careful CSS resetting to match existing custom designs.
**Action:** Always check interactive elements like toggles and dropdowns. If they are `div`s, convert to `button`s and reset styles, adding `aria-expanded` and `aria-controls` for full accessibility.
