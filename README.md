<div align="center">

<h1>Shopify Catalog Automation & Listing Optimization</h1>

<img src="https://readme-typing-svg.herokuapp.com?font=Inter&weight=800&size=22&duration=3000&pause=1000&color=6366F1&center=true&vCenter=true&width=800&lines=Automated+Product+Catalog+Generation;SEO-Optimized+Product+Descriptions;Shopify+Admin+REST+API+Synchronization;Full-Stack+E-Commerce+Automation" alt="Typing Header" />

<p><strong>Automated E-Commerce Product Catalog Ingestion, SEO Enrichment, and Storefront Sync</strong></p>

<p>
  <a href="https://skillicons.dev"><img src="https://skillicons.dev/icons?i=python,fastapi,react,js,github&theme=dark" alt="Skills" /></a>
</p>

</div>

---

## Executive Summary

The Shopify Catalog Automation platform streamlines e-commerce inventory publishing. From supplier specifications or raw imagery, the pipeline generates SEO-optimized product titles, descriptions, tag hierarchies, and variant pricing schemas, publishing directly to Shopify storefronts through authenticated Admin REST APIs.

---

## Platform Interface & Listing Gallery

<table align="center">
  <tr>
    <td align="center"><b>Product Ingestion & Title Optimization</b><br><sub>Raw product specification ingestion and SEO title generation.</sub></td>
    <td align="center"><b>Attribute Extraction & Taxonomy Mapping</b><br><sub>Automated category mapping and variant property extraction.</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="frontend/screenshots/1.png" alt="Product Ingestion" width="460"/></td>
    <td align="center"><img src="frontend/screenshots/2.png" alt="Attribute Extraction" width="460"/></td>
  </tr>
  <tr>
    <td align="center" colspan="2"><b>Shopify Storefront Synchronization Dashboard</b><br><sub>Direct API synchronization with live storefront inventory catalogs.</sub></td>
  </tr>
  <tr>
    <td align="center" colspan="2"><img src="frontend/screenshots/3.png" alt="Shopify Sync" width="650"/></td>
  </tr>
</table>

---

## System Architecture

```mermaid
flowchart TD
    A[Raw Supplier Specs / Product Imagery] --> B[Data Normalization & Attribute Extraction]
    B --> C[SEO Optimization & Title Generation]
    C --> D[HTML Description & Structured Tag Generator]
    D --> E[Shopify Admin REST API Gateway]
    E --> F[Storefront Inventory Catalog & Live Listings]
```

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| Frontend | React, Vite, Tailwind CSS |
| Backend API | Python, FastAPI, Requests |
| Storefront Integration | Shopify Admin REST API |

---

## Installation & Setup

```bash
# Clone the repository
git clone https://github.com/sohailahmed-bsrh/shopify-listing.git
cd shopify-listing

# Configure backend
cd backend
pip install -r requirements.txt
python main.py

# Configure frontend
cd ../frontend
npm install
npm run dev
```

---

## Author & License

- **Author**: Sohail Ahmed ([Portfolio](https://sohail.devsil.com) | [GitHub](https://github.com/sohailahmed-bsrh))
- **License**: Distributed under the MIT License.
