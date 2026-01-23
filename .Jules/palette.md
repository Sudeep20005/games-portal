## 2026-01-23 - Mobile Menu Accessibility
**Learning:** Legacy `div`-based menu toggles are common in this codebase and block screen readers. Converting to `button` requires careful CSS resets to maintain visual parity.
**Action:** When auditing legacy UI components, check for `div` interactions first. Always add `aria-expanded` state toggling to JS when fixing these.
