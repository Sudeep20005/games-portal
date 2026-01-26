## 2024-05-23 - Semantic Button Replacement
**Learning:** Replacing interactive `div` elements with semantic `<button>` tags significantly improves accessibility (keyboard focus, screen reader support) but requires careful CSS resetting (background, border, padding, font) to avoid breaking the existing visual design.
**Action:** When refactoring for accessibility, always pair HTML tag changes with CSS resets that strip default browser styles, and verify visual regression.
