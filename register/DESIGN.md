```markdown
# Design System Document: LifeLink

## 1. Overview & Creative North Star: "The Vital Pulse"
The goal of this design system is to transcend the clinical coldness of medical apps, replacing it with a "Vital Pulse"—a high-end, editorial experience that balances the urgency of blood donation with a sense of calm, premium care. 

We reject the "generic SaaS" look. There are no harsh borders or cluttered grids here. Instead, we use **Organic Layering** and **Asymmetric Breathing Room**. By utilizing high-contrast typography scales and sophisticated tonal depth, we create an environment that feels both authoritative and deeply empathetic. The interface should feel like a high-end wellness journal: spacious, intentional, and human.

---

## 2. Colors: Tonal Depth & The Blood Gradient
Our palette is rooted in a deep, life-affirming red, supported by a sophisticated range of "cool-tinted" neutrals.

### Primary & Action
*   **The Signature Gradient:** Transitions from `primary_container` (#b71c1c) to `primary` (#91000a). Use this exclusively for high-impact CTAs and Hero moments to signify "The Gift of Life."
*   **Tertiary Accents:** `tertiary` (#00487d) is used for trust-building elements, such as medical certifications or "Verified Donor" badges.

### Surface Hierarchy (The "No-Line" Rule)
**Strict Mandate:** Prohibit 1px solid borders for sectioning. Boundaries must be defined solely through background color shifts.
*   **Base Layer:** `surface` (#f9f9fb).
*   **Sectioning:** Use `surface_container_low` (#f3f3f5) to define content blocks against the base.
*   **Floating Elements:** Use `surface_container_lowest` (#ffffff) for cards to make them appear naturally elevated.

### The Glass & Gradient Rule
To move beyond a "standard" feel, use **Glassmorphism** for navigation bars and floating action buttons. Apply `surface` at 80% opacity with a `backdrop-blur` of 20px. This allows the primary red gradients of the content to bleed through softly, creating a "frosted glass" depth that feels modern and premium.

---

## 3. Typography: Editorial Authority
We pair the structural precision of **Manrope** (Display/Headlines) with the hyper-readability of **Inter** (Body).

*   **Display (Manrope):** Use `display-lg` (3.5rem) for impact moments, like donor milestones (e.g., "12 Liters Saved"). 
*   **Headlines (Manrope):** `headline-md` (1.75rem) should be used for section headers with generous `bottom-margin` (Scale 8 - 2rem) to create an editorial feel.
*   **Body (Inter):** `body-lg` (1rem) is the workhorse. Ensure a line-height of 1.6 for maximum empathy and readability.
*   **Intentional Contrast:** Pair a `headline-lg` with a `label-sm` in `secondary` color (#4c616c) to create a sophisticated, high-end hierarchy.

---

## 4. Elevation & Depth: The Layering Principle
We avoid the "shadow-heavy" look of 2010s material design. Depth is achieved through **Tonal Stacking**.

*   **Tonal Layering:** Place a `surface_container_lowest` (#ffffff) card on top of a `surface_container` (#eeeef0) background. The 2-tone shift creates a "soft lift" that feels architectural.
*   **Ambient Shadows:** If a shadow is required for a floating CTA, use `on_surface` at 4% opacity with a 32px blur and 8px Y-offset. It should feel like a soft glow, not a hard drop.
*   **The Ghost Border:** For input fields, use `outline_variant` (#e4beb9) at 20% opacity. If the user cannot see the edge, they cannot feel the container.

---

## 5. Components: Human-Centric Primitives

### Buttons
*   **Primary:** Signature Gradient (`primary_container` to `primary`). `Rounded-xl` (1.5rem). No shadow; use a subtle `on_primary_container` inner-glow.
*   **Secondary:** `surface_container_highest` background with `primary` text. This provides a "soft" alternative that doesn't compete for urgency.

### Cards & Lists (The "Anti-Divider" Rule)
*   **No Dividers:** Never use a 1px line to separate list items. 
*   **Vertical Spacing:** Use `spacing-6` (1.5rem) between items. 
*   **Tonal Alternation:** Use a subtle `surface_container_low` background for every second item in a list to provide a "zebra-stripe" guidance without visual clutter.

### Blood Urgency Chips
*   **Critical:** `error_container` (#ffdad6) background with `on_error_container` (#93000a) text.
*   **Pending:** `secondary_fixed` (#cfe6f2) with `on_secondary_fixed_variant` (#354a53).

### Signature Component: The "Vitality Pulse" Tracker
A custom horizontal progress bar using a `primary` gradient that "pulses" (subtle opacity animation). The container uses `surface_variant` with `rounded-full`.

---

## 6. Do’s and Don'ts

### Do:
*   **Do** use asymmetrical margins. A wider left margin (Scale 10) for headlines creates a sophisticated editorial "spine."
*   **Do** use `rounded-2xl` (16px) for large containers and `rounded-xl` (12px) for buttons/inputs to maintain a "soft-modern" approachable feel.
*   **Do** use `tertiary_container` for educational moments to signal "Information" rather than "Urgency."

### Don't:
*   **Don't** use pure black (#000000). Always use `on_surface` (#1a1c1d) for text to maintain a premium, ink-on-paper feel.
*   **Don't** use standard "Alert" boxes. Use a full-width `surface_container_high` banner with a `primary` left-accent-bar (4px).
*   **Don't** crowd the screen. If a screen feels full, increase the spacing scale by one increment. Trust the white space.