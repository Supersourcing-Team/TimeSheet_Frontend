---
name: enterprise-ui-ux-design-system
description: Single source of truth for UI/UX architecture, design tokens, component library standards, Framer Motion animations, and WCAG accessibility for the Timesheet platform.
risk: safe
source: project-standards
version: "2.0.0"
date_updated: "2026-10-27"
---

# Enterprise UI/UX Design System & Architectural Standards

## 🎯 Purpose & Scope
This document serves as the authoritative single source of truth (SSOT) for all UI/UX engineering, visual design tokens, component structures, and motion guidelines across the platform. Every UI contribution, component addition, or refactor must strictly adhere to these standards.

---

## 🛠️ Technology Stack & Dependencies

All UI development must use the verified application stack:

| Layer | Technology | Usage Guideline |
| :--- | :--- | :--- |
| **Framework** | React 19 + TypeScript | Strict typing; functional components with custom hooks. |
| **Styling** | Tailwind CSS v4 (`@theme`) | Token-driven OKLCH colors, spacing, and typography. |
| **Primitives** | shadcn/ui pattern (Radix UI) | Accessible, unstyled primitives wrapped in `src/components/ui/`. |
| **Motion** | Motion v12 (`motion/react`) | Composited micro-interactions, layout transitions, exit anims. |
| **Icons** | Lucide React (`lucide-react`) | 16px/20px/24px icons with uniform stroke width (`1.75px`). |
| **State** | Redux Toolkit | Server state caching and shared application context. |

> **Strict Prohibition:** Do NOT introduce GSAP, React Three Fiber (R3F), or raw 3D CSS transforms for business and administrative workflows. All interfaces must prioritize high information density, speed, and standard web accessibility.

---

## 📐 Design Tokens (Tailwind v4 OKLCH System)

All visual styling must consume tokens defined in `src/index.css` via Tailwind utility classes or CSS custom variables.

### 1. Color Palette (OKLCH)
- **Background (`--color-background`):** `oklch(0.97 0.01 240)` — Crisp, clean slate-tinted canvas.
- **Surface (`--color-surface` / `--color-card`):** `#ffffff` — Elevated card and panel surfaces.
- **Surface Muted (`--color-surface-muted`):** `oklch(0.95 0.015 240)` — Table headers, badge backgrounds.
- **Primary Brand (`--color-primary`):** `oklch(0.55 0.22 255)` — Sapphire Blue for primary actions.
- **Primary Hover (`--color-primary-hover`):** `oklch(0.48 0.20 255)` — High-contrast interactive hover state.
- **Foreground / Text (`--color-foreground`):** `oklch(0.20 0.04 250)` — Deep navy-slate for readable body text.
- **Muted Text (`--color-muted-foreground`):** `oklch(0.50 0.03 240)` — Supporting text and labels.
- **Borders (`--color-border`):** `oklch(0.88 0.02 240)` — Subtle dividers between elements.
- **Success (`--color-success`):** `oklch(0.62 0.19 145)` — Approved timesheets, successful actions.
- **Warning (`--color-warning`):** `oklch(0.72 0.17 75)` — Pending approvals, warnings.
- **Destructive (`--color-destructive`):** `oklch(0.58 0.22 25)` — Rejections, deletions, critical errors.

### 2. Typography
- **Body & Controls:** `'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Headings & Badges:** `'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif`
- **Numerical & Code:** `'JetBrains Mono', monospace` (timesheet durations, audit IDs)

### 3. Spacing & Radius
- **Base Grid:** 4px incremental scale (`p-1` = 4px, `p-2` = 8px, `p-3` = 12px, `p-4` = 16px, `p-6` = 24px).
- **Border Radii:**
  - `rounded-md` (6px): Inputs, table rows, badges.
  - `rounded-lg` (8px): Standard cards, dropdown menus.
  - `rounded-xl` (12px): Modals, slide-overs, parent dashboards.

### 4. Elevation Layers
- **Level 0 (Flat):** Table rows, section containers (`bg-surface border border-border`).
- **Level 1 (Card):** Default dashboard cards (`shadow-sm hover:shadow-md transition-shadow`).
- **Level 2 (Popovers / Dropdowns):** Context menus, select dropdowns (`shadow-lg z-30`).
- **Level 3 (Overlays):** Modals, confirmation dialogs (`shadow-2xl z-50`).

---

## 🧩 Component Architecture & Hierarchy

### 1. Folder Structure
The codebase organizes components according to strict atomic boundaries:

```
src/
├── components/
│   ├── ui/                    # Atomic, domain-agnostic primitives (shadcn pattern)
│   │   ├── button.tsx         # Button with variants (default, outline, ghost, destructive)
│   │   ├── input.tsx          # Form inputs with focus rings & error states
│   │   ├── dialog.tsx         # Accessible modal dialogs with focus traps
│   │   ├── dropdown-menu.tsx  # Context and action menus
│   │   ├── table.tsx          # Consistent tabular data display
│   │   └── badge.tsx          # Status badges (pending, approved, rejected)
│   ├── common/                # Composed reusable widgets
│   │   ├── ConfirmDialog.tsx  # Pre-configured confirmation prompts
│   │   ├── DataTable.tsx      # Paginated, filterable table wrapper
│   │   ├── EmptyState.tsx     # Standard zero-data visual state
│   │   ├── PageHeader.tsx     # Title, breadcrumbs, action button bar
│   │   └── Pagination.tsx     # Unified pagination controls
│   ├── features/              # Domain-specific feature modules
│   │   ├── timesheets/        # Timesheet submissions, weekly grids, validations
│   │   ├── leaves/            # Leave calendars, approvals, balance summaries
│   │   └── admin/             # User rosters, holiday management, system settings
│   └── layout/                # Shell layout
│       ├── Header.tsx         # Global navigation bar & notifications
│       └── Sidebar.tsx        # Responsive role-based navigation sidebar
```

### 2. Component Implementation Standards
1. **Source of Truth:** Never write raw inline `<button className="...">` or `<input className="...">` within feature screens. Always import from `src/components/ui/`.
2. **Class Merging:** All primitives must use the `cn()` utility (`clsx` + `tailwind-merge`) to allow variant overrides cleanly.
3. **File Size Limit:** No single component file may exceed **250 lines of code**. Decompose sub-components and extract data operations into custom hooks (`useTimesheetSubmission.ts`, `useLeaveApproval.ts`).

---

## 🎬 Motion & Animation Standards (`motion/react`)

Animations must remain subtle, performant, and purposeful. Decorative animations must never impede user task completion.

### 1. Standard Motion Curves & Durations
```typescript
import { Variants, Transition } from "motion/react";

// Standard physics-based spring for dialogs & popovers
export const springTransition: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 30,
};

// Smooth cubic easing for slide and fade transitions
export const smoothTransition: Transition = {
  duration: 0.2,
  ease: [0.16, 1, 0.3, 1],
};

// Standard modal animation variant
export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: springTransition },
  exit: { opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.15 } },
};

// Staggered list entrance variant
export const listContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

export const listItemVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};
```

### 2. Animation Rules
1. **Composited Properties:** Only animate `transform` and `opacity`. Never animate `width`, `height`, `margin`, or `padding` directly.
2. **Durations:**
   - Button clicks / toggles: **100ms – 150ms**
   - Dropdowns / popovers: **150ms – 200ms**
   - Modals / slide-overs: **200ms – 300ms**
   - Maximum allowed animation time: **350ms**
3. **Reduced Motion:** Always respect `prefers-reduced-motion: reduce`. Use the `useReducedMotion()` hook or CSS `@media (prefers-reduced-motion: reduce)` to disable motion for sensitive users.

---

## ♿ Accessibility (WCAG 2.1 AA) & Responsiveness

### 1. Accessibility Mandates
- **Contrast Ratios:** Maintain at least **4.5:1** contrast for normal text and **3:1** for large headings or UI control borders against the canvas.
- **Keyboard Navigation:** Every interactive element must be reachable and operable using `Tab`, `Enter`, and `Space`. Dialogs and dropdowns must trap focus and close on `Escape`.
- **Focus Rings:** Ensure visible focus rings using `focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none`.
- **Forms & Validation:** Every form input must have an associated `<label>`, clear helper text, and accessible validation messages with `aria-invalid` and `aria-describedby`.
- **Icon Buttons:** Standalone icon-only buttons must include an explicit `aria-label` attribute.

### 2. Responsive Breakpoints
- **Mobile (`< 768px`):** Collapsed mobile drawer sidebar, stacked card layouts for tables, full-width action modals.
- **Tablet (`768px – 1024px`):** Icon-only collapsed sidebar, scrollable horizontal tables.
- **Desktop (`≥ 1024px`):** Persistent full sidebar navigation, multi-column forms, fixed table headers.

---

## 🛡️ Governance & PR Review Checklist

Before opening or approving any pull request containing UI changes, verify each item:

- [ ] **Primitive Usage:** Feature uses primitives from `src/components/ui/` rather than inline raw elements.
- [ ] **Token Adherence:** All colors and styles utilize `@theme` OKLCH tokens in `src/index.css`. No hardcoded hex values or arbitrary dimensions (`w-[317px]`).
- [ ] **Motion Standards:** Animations use `motion/react` with spring/smooth tokens and respect `useReducedMotion()`.
- [ ] **Accessibility:** Keyboard navigable, proper ARIA tags, visible focus indicators, and WCAG 2.1 AA compliant contrast.
- [ ] **Icon Standards:** Lucide icons use `w-4 h-4` / `w-5 h-5` with `stroke-[1.75px]` and appropriate `aria-label` or `aria-hidden`.
- [ ] **Modularity:** Files do not exceed 250 lines; stateful business logic is encapsulated in custom hooks.
- [ ] **Documentation Sync:** Any new UI primitive, token addition, or pattern change is reflected in this file.
