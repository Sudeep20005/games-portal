## 2024-10-24 - Semantic Button Refactoring
**Learning:** Legacy static sites often use `div`s for interactive elements like menus, replicated across multiple files. Converting these to semantic `<button>`s requires not just HTML changes but aggressive CSS resets (border: none, background: transparent, font: inherit) to match the original "invisible" container style of the `div`.
**Action:** When refactoring interactive elements in static architectures, automate the HTML replacement across all files and explicitly reset browser-default styles in CSS to prevent visual regressions.
