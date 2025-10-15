# FungiCount
A simple, automated, and visual online accounting application for 'The Fun Guy' to track sales, inventory, and financial performance across multiple channels.
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Zgoubnight/fungi-code)
FungiCount is a comprehensive, modern accounting web application designed specifically for 'The Fun Guy'. It replaces an outdated, buggy system with a robust, intuitive, and visually stunning platform built on Cloudflare's serverless architecture. The application provides a centralized hub for managing sales, inventory, and financial performance across multiple channels including a website, Amazon, and pharmacies.
## ✨ Key Features
-   **��� Dynamic Dashboard:** Get a high-level overview of your business's financial health with KPIs for revenue, margins, and sales. Visualize data with dynamic charts.
-   **📦 Inventory Management:** A full CRUD interface to manage products. Track stock levels in real-time and receive alerts for low-stock items.
-   **🧾 Sales Ledger:** A detailed log of all sales transactions, filterable by date, channel, or customer.
-   **📈 Forecasting:** Set and track monthly sales and revenue goals. Visually compare actual performance against set objectives with progress bars and status indicators.
-   **📄 CSV/Excel Import:** Seamlessly import external sales data from platforms like Amazon to keep your records and inventory automatically updated.
-   **🤖 Automated Calculations:** Automatic calculation of monthly/annual revenue, gross margin, and net margin.
-   **🔌 Webhook Integration:** Secure endpoint to receive sales data from external platforms like WordPress.
## 🚀 Technology Stack
-   **Frontend:** React, Vite, Tailwind CSS, shadcn/ui
-   **Backend:** Cloudflare Workers, Hono
-   **Database:** Cloudflare D1 (via Durable Objects)
-   **State Management:** Zustand
-   **Charting:** Recharts
-   **Routing:** React Router
-   **Type-safety:** TypeScript
## 🔌 API Webhook Integration
FungiCount provides a secure webhook endpoint to receive sales data from external platforms (e.g., WordPress/WooCommerce).
-   **Endpoint URL:** `/api/webhook/sale`
-   **Method:** `POST`
-   **Authentication:** You must include your API key in the request headers. The key can be generated and found on the "Paramètres" page of the application.
    -   **Header Name:** `X-API-KEY`
    -   **Header Value:** `fungi_...` (Your generated API key)
### Payload Format
The request body must be a JSON object with the following structure:
```json
{
  "customer": {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "source": "WordPress"
  },
  "product": {
    "sku": "FGS-LION-SITE"
  },
  "sale": {
    "quantity": 2,
    "totalPrice": 59.80,
    "saleDate": "2024-08-15T10:30:00Z",
    "channel": "site",
    "promoCode": "SUMMER2024"
  }
}
```
### Field Descriptions:
-   **customer.name** (string, required): The full name of the customer.
-   **customer.email** (string, optional): The customer's email address.
-   **customer.source** (string, optional): The source of the customer (defaults to 'Webhook').
-   **product.sku** (string, required): The SKU of the product sold. This must match an existing product SKU in FungiCount.
-   **sale.quantity** (number, required): The number of units sold.
-   **sale.totalPrice** (number, required): The total price of the transaction for this item.
-   **sale.saleDate** (string, optional): The date of the sale in ISO 8601 format. Defaults to the current time if not provided.
-   **sale.channel** (string, optional): The sales channel (`site`, `amazon`, etc.). Defaults to 'site'.
-   **sale.promoCode** (string, optional): Any promo code used for the sale.
## �� Getting Started
Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.
### Prerequisites
-   [Node.js](https://nodejs.org/en/) (v18 or later recommended)
-   [Bun](https://bun.sh/) package manager
-   A Cloudflare account with Wrangler CLI configured.
### Installation
1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd fungicount
    ```
2.  **Install dependencies:**
    This project uses Bun for package management.
    ```bash
    bun install
    ```
## 🛠️ Development
To start the local development server, which includes both the Vite frontend and the Cloudflare Worker backend, run:
```bash
bun dev
```
This will start the application, typically on `http://localhost:3000`. The frontend will hot-reload on changes, and the worker will restart automatically.
### Project Structure
-   `src/`: Contains the React frontend application code.
    -   `pages/`: Top-level page components for each view.
    -   `components/`: Reusable UI components, including shadcn/ui elements.
    -   `lib/`: Utility functions, API client, and state management.
-   `worker/`: Contains the Cloudflare Worker backend code.
    -   `index.ts`: The main entry point for the worker.
    -   `user-routes.ts`: API route definitions.
    -   `entities.ts`: Data models and logic for interacting with storage.
-   `shared/`: Contains TypeScript types shared between the frontend and backend.
## ☁️ Deployment
This application is designed to be deployed to Cloudflare Pages. The `bun run deploy` script will build the application and deploy it using the Wrangler CLI.
1.  **Login to Cloudflare:**
    ```bash
    bunx wrangler login
    ```
2.  **Build and Deploy:**
    Run the deploy script from the root of the project.
    ```bash
    bun run deploy
    ```
Wrangler will handle the process of building the frontend assets, bundling the worker, and deploying them to your Cloudflare account.
Alternatively, you can deploy directly from your GitHub repository with a single click.
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Zgoubnight/fungi-code)
## 📜 Available Scripts
-   `bun dev`: Starts the local development server.
-   `bun build`: Builds the frontend and worker for production.
-   `bun lint`: Lints the codebase using ESLint.
-   `bun deploy`: Builds and deploys the application to Cloudflare.