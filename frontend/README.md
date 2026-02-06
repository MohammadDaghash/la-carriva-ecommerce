# Frontend – Shopify Theme

This directory contains the Shopify Online Store 2.0 theme used for the La Carriva storefront.

## Structure Overview

- `layout/` – Global layout files (e.g., theme.liquid)
- `sections/` – Modular page sections (homepage, product, cart, etc.)
- `blocks/` – Reusable sub-components used within sections
- `snippets/` – Shared partials (header, footer, helpers)
- `templates/` – Page templates and JSON routing
- `assets/` – JavaScript, CSS, and static assets
- `config/` – Theme configuration and settings schema
- `locales/` – Internationalization files

## Notes

- Built and customized for a production Shopify store
- Uses Shopify Online Store 2.0 architecture
- JavaScript is used to enhance interactivity and UX
- This code is archived for portfolio and architectural demonstration

## Data Model Overview

Product data is documented using a Shopify product export (`data/products.csv`).

Key fields used by the storefront:

- **Handle** – Unique product identifier used for routing  
  Example: `/products/{handle}` maps directly to `templates/product.*`

- **Tags** – Used for categorization, filtering, and collection logic  
  Enables dynamic product grouping without hardcoding UI logic

- **Variants** – Option columns (size, color, etc.) define purchasable SKUs  
  Reflected in product templates and cart behavior

This structure mirrors real-world commerce systems where data modeling
directly drives URL structure, page rendering, and filtering logic.

