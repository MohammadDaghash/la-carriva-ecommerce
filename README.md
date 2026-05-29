# La Carriva — Data-Aware Shopify E-Commerce Storefront

La Carriva is a customized Shopify Online Store 2.0 storefront for a bag and luggage brand.

This repository is kept as a portfolio version of the project. It focuses on real storefront architecture, product data modeling, responsive UI customization, product discovery, and the foundations needed for future analytics and recommendation features.

The project is not presented as a machine learning system yet. Instead, it shows how a real e-commerce storefront can be structured so that product metadata, customer interactions, filtering, search, and recommendations can later become part of a data science workflow.

## Demo

![La Carriva storefront demo](demo.gif)

## Why This Project Matters

My background is in Mathematics and Computer Science, and I am continuing toward Statistics and Data Science. I use this project as a practical bridge between software engineering and data-driven product thinking.

La Carriva helped me work with problems that are very relevant to data and ML-oriented product development:

* How products should be represented as structured data
* How categories, tags, variants, and metadata affect discovery
* How filtering and search shape user behavior
* How storefront UX decisions affect conversion and engagement
* How a commerce system can later support recommendations, analytics, and personalization

## What Is Implemented

### Shopify Storefront Architecture

* Shopify Online Store 2.0 theme structure
* Liquid templates, sections, blocks, and snippets
* JSON templates for pages, products, collections, cart, search, and homepage layout
* Theme configuration through Shopify settings files
* Multi-language locale files
* Responsive storefront layout for desktop and mobile

### Product Catalog & Data Model

The repository includes a Shopify product export under `data/products.csv`.

The catalog currently documents:

* 118 products
* 1,117 product export rows including variants and images
* 63 product data fields
* Product handles used for URL routing
* Product categories and types
* Product tags used for filtering and grouping
* Variant data such as size and color
* Product images and image positions
* SEO titles and descriptions
* Shopify metafields for materials, bag features, target gender, and product discovery

This makes the project useful not only as a storefront, but also as a structured product dataset that can later be used for analytics or recommendation experiments.

### Product Discovery Features

* Collection pages with filtering and sorting
* AJAX-based filter updates without full page reloads
* URL synchronization when filters change
* Desktop filters that apply immediately
* Mobile filter drawer behavior that waits for the user to apply changes
* Predictive search UI
* Recently viewed products stored in browser local storage
* Product recommendations powered through Shopify recommendation sections

### Custom Frontend Behavior

Several JavaScript customizations were added to improve the shopping experience:

* `ajax-filters.js` updates collection results dynamically and keeps filter state synced with the URL
* `card-gallery-fixes.js` improves product card gallery behavior, especially on mobile and carousel layouts
* `product-title-truncation.js` calculates responsive product title truncation using `ResizeObserver`
* `recently-viewed-products.js` stores recently viewed products locally for better discovery
* `predictive-search.js` integrates recently viewed products into search behavior
* `product-recommendations.js` lazy-loads product recommendations and caches recommendation responses
* `auto-close-details.js` improves dropdown and details behavior on desktop and mobile

### Storefront UX Customization

* Mobile-first product grid adjustments
* Product card gallery arrow visibility fixes
* Price styling overrides
* Newsletter input visibility fixes
* Hero call-to-action styling
* Product title and compare-price visibility fixes
* Variant dropdown visibility fixes on mobile
* Header, footer, cart, product page, collection page, and search page customization

## Tech Stack

* Shopify Online Store 2.0
* Liquid
* JSON templates
* JavaScript ES modules
* Web Components / Custom Elements
* CSS
* Shopify product export data
* CSV-based product data modeling

## Repository Structure

```text
la-carriva-ecommerce/
├── README.md
├── demo.gif
├── data/
│   ├── README.md
│   └── products.csv
└── frontend/
    ├── assets/      # JavaScript, CSS, icons, and static theme assets
    ├── blocks/      # Reusable Shopify theme blocks
    ├── config/      # Theme settings and configuration
    ├── layout/      # Main Shopify layout files
    ├── locales/     # Translation files
    ├── sections/    # Shopify Online Store 2.0 page sections
    ├── snippets/    # Shared Liquid partials
    └── templates/   # JSON and Liquid page templates
```

## Data Science & Machine Learning Direction

The current repository does not contain a trained ML model. The honest next step is to build on the existing product data and storefront behavior.

Possible future extensions:

* Product similarity using tags, categories, materials, colors, and product descriptions
* Content-based recommendation scoring
* Product vectors built from structured metadata
* Customer behavior analytics from search, filters, clicks, and recently viewed products
* Collection-level performance analysis
* Conversion funnel analysis
* A/B testing for product cards, filters, and homepage sections
* Demand forecasting if sales history becomes available
* Customer segmentation if anonymized customer behavior data becomes available

A possible product similarity direction:

```text
product = [category, type, tags, color, material, size, price, target_gender]
```

From there, products could be vectorized and compared using similarity metrics such as cosine similarity. This would turn the existing catalog into a foundation for a recommendation system without pretending that the current version already does that.

## How to Run or Preview

This is a Shopify theme repository, not a standalone React or Node.js application.

To preview the theme locally, use Shopify CLI from the theme folder:

```bash
cd frontend
shopify theme dev --store your-store.myshopify.com
```

To check the theme code:

```bash
shopify theme check
```

A Shopify store or development store is required to preview the theme with real Shopify data.

## Project Status

This repository is an archived portfolio version of the La Carriva storefront.

* Checkout and payments are not implemented in this repository directly
* Shopify handles commerce functionality when the theme is connected to a Shopify store
* No customer personal data is stored in this repository
* No private Shopify credentials are included
* The repository is intended for code review, architecture review, and portfolio presentation

## What This Project Demonstrates

* Ability to work with a production-style e-commerce theme architecture
* Understanding of structured product data and commerce metadata
* Frontend customization using Liquid, JavaScript, and CSS
* Practical UX improvements for mobile commerce
* Product discovery through filtering, search, recently viewed products, and recommendations
* Clear thinking about how software systems can evolve into data-driven systems

## Author

**Mohammad Daghash**

B.Sc. in Mathematics and Computer Science
M.Sc. in Statistics and Data Science — ongoing

Interested in software engineering, machine learning, data science, statistical modeling, and intelligent product systems.
