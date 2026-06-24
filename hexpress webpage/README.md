# Hexpress Landing Page

This folder contains the static RapidHealth landing page built with plain HTML, CSS, and JavaScript.

## Stack

- HTML: `index.html`
- CSS: `styles.css`
- Motion styles: `animation.css`
- JavaScript: `script.js`
- Images and icons: `assets/`

## How to Run

You can open the page directly in a browser from `index.html`.

If needed, you can also preview it through any simple static browser preview tool.

Page entry file:

```text
hexpress webpage/index.html
```

## Page Structure

The landing page is organized into these main sections:

1. Sticky header with desktop navigation and mobile menu
2. Hero section
3. Features section
4. Men and women treatment categories
5. Popular treatments product carousel
6. Customer testimonials carousel
7. How It Works section
8. FAQ accordion
9. Contact/help section
10. Footer

## File Overview

### `index.html`

Contains the complete page markup, including:

- header and mobile navigation
- CTA buttons and image assets
- category cards
- product slider markup
- testimonial slider markup
- FAQ items
- contact/help content

### `styles.css`

Contains the main layout and responsive rules for the page, including:

- color variables
- typography and spacing
- desktop and mobile breakpoints
- category card layout
- slider card styles
- FAQ styles
- contact/help section styling
- hover and motion states

### `animation.css`

Contains extra animation-related styling loaded alongside `styles.css`.

### `script.js`

Initializes all interactive page behavior:

- sticky header state on scroll
- mobile menu open/close behavior
- reusable carousels for products and testimonials
- touch and pointer drag support for sliders
- FAQ accordion state switching
- scroll reveal behavior
- dedicated reveal handling for the How It Works section

## Responsive Behavior

Important active breakpoints currently used in the page styles include:

- `1366px`
- `1280px`
- `1242px`
- `1200px`
- `1100px`
- `1000px`
- `900px`
- `768px`
- `760px`
- `700px`
- `460px`

Examples of responsive behavior already implemented:

- header changes to a menu-button layout on smaller screens
- category large-card images swap to `_M` assets at `1100px` and below
- product and testimonial sliders reduce visible cards at smaller widths
- multi-column sections stack into a single-column mobile layout

## Assets

The `assets/` folder contains:

- hero artwork
- section illustrations
- product images
- testimonial profile images
- category images
- icons and arrows

Keep file names unchanged unless you also update the corresponding markup and styles.

## Motion and Interaction Notes

Current interaction patterns include:

- button and card hover effects
- scroll reveal for key sections
- sequential reveal in the How It Works section
- FAQ accordion expand/collapse behavior
- swipe/drag support on both carousels

When adjusting motion, prefer:

- `transform`
- `opacity`

Avoid animating layout-heavy properties unless there is a clear reason.

## Editing Notes

- Most visual changes can be handled in `styles.css`.
- Structural changes belong in `index.html`.
- Slider, FAQ, menu, and reveal logic belong in `script.js`.
- If you update asset names, update both the HTML and any breakpoint-specific rules tied to them.
- Test on both desktop and mobile widths after changing layout or interactive behavior.

## Recommended Workflow

1. Edit markup in `index.html` when changing content or section structure.
2. Update `styles.css` for spacing, colors, layout, and responsive behavior.
3. Update `script.js` only when interaction behavior needs to change.
4. Recheck the page at desktop and mobile widths after each UI change.