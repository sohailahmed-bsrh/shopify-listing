<div align="center">

<h1>Shopify Catalog Automation & Listing Optimization</h1>

<img src="https://readme-typing-svg.herokuapp.com?font=Inter&weight=800&size=22&duration=3000&pause=1000&color=6366F1&center=true&vCenter=true&width=800&lines=Automated+Product+Catalog+Generation;SEO-Optimized+Product+Descriptions;Shopify+Admin+REST+API+Synchronization;Full-Stack+E-Commerce+Automation" alt="Typing Header" />

<p><strong>Automated E-Commerce Product Catalog Ingestion, SEO Enrichment, and Storefront Sync</strong></p>

<p>
  <a href="https://skillicons.dev"><img src="https://skillicons.dev/icons?i=python,fastapi,react,js,github&theme=dark" alt="Skills" /></a>
</p>

<p>
  <a href="#overview">Overview</a> &bull;
  <a href="#system-architecture">Architecture</a> &bull;
  <a href="#visual-showcase-gallery">Visual Gallery</a> &bull;
  <a href="#core-capabilities">Capabilities</a> &bull;
  <a href="#installation--setup">Installation</a> &bull;
  <a href="#author--contact-information">Author</a>
</p>

</div>

---
## Overview

The Shopify Catalog Automation platform streamlines e-commerce inventory publishing. From supplier specifications or raw imagery, the pipeline generates SEO-optimized product titles, descriptions, tag hierarchies, and variant pricing schemas, publishing directly to Shopify storefronts through authenticated Admin REST APIs.

---

## Visual Showcase Gallery

<table width="100%" align="center">
  <tr>
    <td width="50%" align="center"><b>Product Ingestion & Title Optimization</b><br><sub>Raw product specification ingestion and SEO title generation.</sub></td>
    <td width="50%" align="center"><b>Attribute Extraction & Taxonomy Mapping</b><br><sub>Automated category mapping and variant property extraction.</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="frontend/screenshots/1.png" alt="Product Ingestion" width="460"/></td>
    <td align="center"><img src="frontend/screenshots/2.png" alt="Attribute Extraction" width="460"/></td>
  </tr>
  <tr>
    <td colspan="2" align="center"><b>Shopify Storefront Synchronization Dashboard</b><br><sub>Direct API synchronization with live storefront inventory catalogs.</sub></td>
  </tr>
  <tr>
    <td colspan="2" align="center"><img src="frontend/screenshots/3.png" alt="Shopify Sync" width="650"/></td>
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

## Author & Contact Information

<table width="100%" align="center">
  <tr>
    <td align="center" style="padding: 20px;">
      <h3>Sohail Ahmed</h3>
      <p><strong>Full-Stack Artificial Intelligence & Computer Vision Engineer</strong></p>
      <p>
        <a href="https://sohail.devsil.com"><img src="https://img.shields.io/badge/Live_Portfolio-sohail.devsil.com-0052FF?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Portfolio"/></a>
        <a href="https://github.com/sohailahmed-bsrh"><img src="https://img.shields.io/badge/GitHub-Profile-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"/></a>
        <a href="https://linkedin.com/in/sohail-ahmed-dev"><img src="https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"/></a>
        <a href="mailto:sohail.bsrh@gmail.com"><img src="https://img.shields.io/badge/Email-Contact_Me-EA4335?style=for-the-badge&logo=gmail&logoColor=white" alt="Email"/></a>
      </p>
      <p><em>Available for technical roles in Artificial Intelligence, Computer Vision, and Full-Stack Engineering.</em></p>
      <hr style="border: 0; height: 1px; background: #30363d; margin: 15px 0;">
      <small>Repository: <code>sohailahmed-bsrh/shopify-listing</code> &bull; Distributed under the MIT License.</small>
    </td>
  </tr>
</table>
