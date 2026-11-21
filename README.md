# Shopify Product Catalog Automation Suite

## Description
Inventory management and catalog automation suite that validates supplier product feeds and batch-uploads product variants via the Shopify Admin REST API.

## Live Demo
Access the live demonstration and portfolio showcase at: [https://sohail.devsil.com/projects.html](https://sohail.devsil.com/projects.html)

## Tech Stack
- Python 3.10+
- Shopify Admin API
- Requests
- Pandas

## Getting Started

### Prerequisites
- Python 3.10 or higher
- Git version control

### Installation and Setup
1. Clone the repository:
```bash
git clone https://github.com/sohailahmed-bsrh/shopify-listing.git
cd shopify-listing
```

2. Configure environment and dependencies:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python main.py
```

## Environment Variables

Configure the following environment variables in a `.env` file at the root directory:

```env
SHOPIFY_STORE_URL=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxx
```

## Architecture and Project Structure
The repository is structured according to modular engineering standards:

```text
shopify-listing/
|-- src/
|-- data/
|-- .gitignore
|-- README.md
`-- requirements.txt
```

## Interface and Verification
The system produces verifiable execution logs, data summaries, or interactive interfaces depending on the execution target. Validate operation by running the test suite or local entrypoint.

## Author
Developed by Sohail Ahmed ([Portfolio](https://sohail.devsil.com) | [GitHub](https://github.com/sohailahmed-bsrh)).
