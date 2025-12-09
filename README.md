# Electronics Vendor Management System

A comprehensive React application for managing electronics retail operations (similar to Best Buy or Circuit City) that operates both online and in-store channels. The system manages the complete lifecycle from product catalog to order fulfillment.

## Business Context

This application supports an electronics vendor with:
- **Multi-channel Operations**: Both online website and physical store chain
- **Product Organization**: Electronics grouped by type (cameras, phones, computers), manufacturer (Sony, Apple, HP), or bundled packages
- **Customer Types**: Contract customers with monthly billing accounts, and one-time purchasers using credit/debit cards
- **Inventory Management**: Accurate tracking across stores and warehouses with automatic reorder to manufacturers
- **Order Fulfillment**: Online orders shipped with tracking, in-store orders fulfilled directly
- **Sales Analytics**: Comprehensive data for marketing and corporate planning

## Features

- **Customer Management**: Manage both contract customers (monthly billing) and one-time purchasers
- **Product Catalog**: Manage electronics products, SKUs, prices, and bundle packages (e.g., Gateway PC with Sony monitor and HP printer)
- **Order Processing**: Handle orders from both ONLINE and INSTORE channels
- **Inventory Tracking**: Monitor inventory levels across stores and warehouses with reorder level alerts
- **Manufacturer Management**: Track electronics manufacturers (Sony, Apple, HP, Gateway, etc.)
- **Category System**: Organize products with hierarchical, overlapping categories for flexible marketing
- **Account Management**: Manage contract customer accounts with credit limits and monthly billing
- **Payment Processing**: Handle account billing for contract customers and card payments for others
- **Shipment Tracking**: Track online order shipments with tracking numbers for customer inquiries

## Tech Stack

**Frontend:**
- React 18
- React Router DOM
- Vite (build tool)

**Backend:**
- Node.js with Express
- Oracle Database (oracledb driver)
- RESTful API

**Database:**
- Oracle Database (primary)
- PostgreSQL/MySQL versions also available

## Getting Started

### Prerequisites

1. **Node.js** (v16 or higher)
2. **Oracle Database** (11g or higher)
3. **Oracle Instant Client** (required for oracledb npm package)
   - Download from [Oracle Instant Client Downloads](https://www.oracle.com/database/technologies/instant-client/downloads.html)
   - Follow installation instructions for your operating system

### Step 1: Set Up Oracle Database

1. **Create the database schema:**
   ```bash
   # Connect to Oracle using SQL*Plus or SQL Developer
   sqlplus username/password@database
   
   # Run the schema creation script
   @database_schema.sql
   ```

2. **Verify tables were created:**
   ```sql
   SELECT table_name FROM user_tables ORDER BY table_name;
   ```

### Step 2: Set Up Backend Server

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env with your Oracle database credentials
   # DB_USER=your_oracle_username
   # DB_PASSWORD=your_oracle_password
   # DB_CONNECTION_STRING=localhost:1521/XE
   ```

4. **Start the backend server:**
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

   The backend API will be available at `http://localhost:3001`

### Step 3: Set Up Frontend

1. **Navigate to project root:**
   ```bash
   cd ..
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure API URL (optional):**
   ```bash
   # Create .env file in project root
   # VITE_API_URL=http://localhost:3001/api
   ```
   
   If your backend runs on a different port, update this value.

4. **Start the development server:**
   ```bash
   npm run dev
   ```

   The React app will be available at `http://localhost:5173`

### Step 4: Verify Connection

1. **Check backend health:**
   ```bash
   curl http://localhost:3001/health
   ```

2. **Test API endpoint:**
   ```bash
   curl http://localhost:3001/api/customers
   ```

3. **Open the React app** in your browser and verify data loads from the database.

### Troubleshooting

**Oracle Connection Issues:**
- Verify Oracle Instant Client is installed and in your PATH
- Check database credentials in `backend/.env`
- Ensure Oracle database is running and accessible
- Verify connection string format: `hostname:port/service_name`

**CORS Issues:**
- Ensure backend CORS_ORIGIN matches your frontend URL
- Check `backend/.env` for CORS_ORIGIN setting

**Port Conflicts:**
- Backend default port: 3001 (change in `backend/.env`)
- Frontend default port: 5173 (change in `vite.config.js`)

### Build for Production

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
npm run build
npm run preview
```

## Database Schema

SQL schema files are provided in the root directory:
- `database_schema.sql` - Oracle SQL version (uses VARCHAR2, NUMBER, DATE)
- `database_schema_postgresql.sql` - PostgreSQL version (uses SERIAL, VARCHAR, NUMERIC)
- `database_schema_mysql.sql` - MySQL version (uses AUTO_INCREMENT, DECIMAL)

The application supports the following entities (schema unchanged as specified):

- **manufacturer**: Electronics manufacturers (Sony, Apple, HP, Gateway, etc.)
- **customer**: Customer information with contract flag (Y/N) for monthly billing vs. one-time purchases
- **account**: Contract customer accounts with credit limits for monthly billing
- **product**: Electronics product catalog with bundle flag (Y/N) for packaged products
- **category**: Product categories with hierarchy (by type, manufacturer, or other groupings)
- **product_category**: Product-category relationships (supports overlapping categories)
- **bundle_component**: Bundle product components (e.g., PC + monitor + printer)
- **location**: Store and warehouse locations (STORE or WAREHOUSE type)
- **inventory**: Inventory levels by location with reorder levels and quantities
- **reorder**: Reorder requests to manufacturers when inventory is low
- **order_header**: Order information with channel (ONLINE/INSTORE) and status
- **order_line**: Order line items with products, quantities, and pricing
- **payment_card**: Customer payment cards (stored for online customers, not in-store)
- **payment**: Payment transactions (account billing or card payments)
- **shipper**: Shipping companies for online order fulfillment
- **shipment**: Shipment tracking with tracking numbers for customer inquiries

## Data Persistence

The application connects to an Oracle database through a Node.js/Express backend API. All data operations are performed through REST API endpoints that interact with the Oracle database.

**Architecture:**
```
React Frontend → Express Backend API → Oracle Database
```

**API Endpoints:**
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer
- Similar endpoints for products, orders, inventory, manufacturers, categories, accounts, payments, shipments

## Project Structure

```
.
├── backend/                 # Backend API server
│   ├── db/
│   │   └── oracle.js        # Oracle database connection
│   ├── routes/              # API route handlers
│   │   ├── customers.js
│   │   ├── products.js
│   │   ├── orders.js
│   │   ├── inventory.js
│   │   ├── manufacturers.js
│   │   ├── categories.js
│   │   ├── accounts.js
│   │   ├── payments.js
│   │   └── shipments.js
│   ├── server.js            # Express server setup
│   ├── package.json
│   └── .env                 # Environment variables (not in git)
│
├── src/                     # React frontend
│   ├── components/          # React components for each entity
│   │   ├── Customers.jsx
│   │   ├── Products.jsx
│   │   ├── Orders.jsx
│   │   ├── Inventory.jsx
│   │   ├── Manufacturers.jsx
│   │   ├── Categories.jsx
│   │   ├── Accounts.jsx
│   │   ├── Payments.jsx
│   │   ├── Shipments.jsx
│   │   └── CommonStyles.css
│   ├── services/            # API service layer
│   │   └── api.js           # HTTP client for backend API
│   ├── App.jsx              # Main app component with routing
│   ├── App.css              # App styles
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
│
├── database_schema.sql      # Oracle database schema
├── database_schema_postgresql.sql
├── database_schema_mysql.sql
├── package.json
└── README.md
```

## Usage

1. **Start both servers:**
   - Backend: `cd backend && npm start`
   - Frontend: `npm run dev`

2. **Navigate through the menu** to access different sections

3. **Create records:** Click "+ Add" buttons to create new records

4. **Edit records:** Click "Edit" to modify existing records

5. **Delete records:** Click "Delete" to remove records (with confirmation)

6. **All data is persisted** in the Oracle database through the backend API

## API Documentation

### Available Endpoints

All endpoints are prefixed with `/api`

**Customers:**
- `GET /customers` - List all customers
- `GET /customers/:id` - Get customer by ID
- `POST /customers` - Create new customer
- `PUT /customers/:id` - Update customer
- `DELETE /customers/:id` - Delete customer

**Products:**
- `GET /products` - List all products
- `GET /products/:id` - Get product by ID
- `POST /products` - Create new product
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product

**Orders:**
- `GET /orders` - List all orders
- `GET /orders/:id` - Get order by ID
- `POST /orders` - Create new order
- `PUT /orders/:id` - Update order
- `DELETE /orders/:id` - Delete order

**Inventory:**
- `GET /inventory` - List all inventory records
- `GET /inventory/:locationId/:productId` - Get specific inventory item
- `POST /inventory` - Create new inventory record
- `PUT /inventory/:locationId/:productId` - Update inventory

**Manufacturers, Categories, Accounts, Payments, Shipments:**
- Similar CRUD operations as above

## Future Enhancements

- Authentication and authorization
- Advanced search and filtering
- Data export functionality
- Reports and analytics
- Real-time inventory updates
- Order line item management
- Bundle component management
- Input validation and error handling improvements

