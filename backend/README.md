# Backend API Server

Express.js REST API server for the Electronics Vendor Management System, connecting to Oracle Database.

## Prerequisites

1. **Node.js** (v16 or higher)
2. **Oracle Database** (11g or higher)
3. **Oracle Instant Client** - Required for the `oracledb` npm package
   - Download from [Oracle Instant Client Downloads](https://www.oracle.com/database/technologies/instant-client/downloads.html)
   - Follow installation instructions for your OS

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` file with your Oracle database credentials:**
   ```env
   DB_USER=your_oracle_username
   DB_PASSWORD=your_oracle_password
   DB_CONNECTION_STRING=localhost:1521/XE
   PORT=3001
   CORS_ORIGIN=http://localhost:5173
   ```

## Running the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:3001` (or the port specified in `.env`)

## API Endpoints

All endpoints are prefixed with `/api`

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order

### Inventory
- `GET /api/inventory` - Get all inventory records
- `GET /api/inventory/:locationId/:productId` - Get specific inventory item
- `POST /api/inventory` - Create inventory record
- `PUT /api/inventory/:locationId/:productId` - Update inventory

### Other Entities
Similar endpoints available for:
- Manufacturers (`/api/manufacturers`)
- Categories (`/api/categories`)
- Accounts (`/api/accounts`)
- Payments (`/api/payments`)
- Shipments (`/api/shipments`)

## Health Check

```bash
curl http://localhost:3001/health
```

Returns: `{"status":"ok","message":"Server is running"}`

## Troubleshooting

### Oracle Connection Issues

1. **Verify Oracle Instant Client is installed:**
   ```bash
   # On Linux/Mac
   echo $LD_LIBRARY_PATH
   
   # On Windows, check PATH environment variable
   ```

2. **Test database connection:**
   ```sql
   -- Connect using SQL*Plus
   sqlplus username/password@connection_string
   ```

3. **Check connection string format:**
   - Format: `hostname:port/service_name`
   - Example: `localhost:1521/XE`
   - Example: `db.example.com:1521/ORCL`

### Common Errors

**Error: "NJS-045: cannot load the oracledb add-on binary"**
- Solution: Install Oracle Instant Client and ensure it's in your PATH/LD_LIBRARY_PATH

**Error: "ORA-12154: TNS:could not resolve the connect identifier"**
- Solution: Check your DB_CONNECTION_STRING format in `.env`

**Error: "ORA-01017: invalid username/password"**
- Solution: Verify DB_USER and DB_PASSWORD in `.env`

**Error: "CORS policy"**
- Solution: Update CORS_ORIGIN in `.env` to match your frontend URL

## Project Structure

```
backend/
├── db/
│   └── oracle.js          # Database connection and query helpers
├── routes/
│   ├── customers.js       # Customer CRUD operations
│   ├── products.js       # Product CRUD operations
│   ├── orders.js         # Order CRUD operations
│   ├── inventory.js      # Inventory operations
│   ├── manufacturers.js  # Manufacturer CRUD operations
│   ├── categories.js     # Category CRUD operations
│   ├── accounts.js       # Account CRUD operations
│   ├── payments.js       # Payment operations
│   └── shipments.js      # Shipment operations
├── server.js             # Express server setup and route registration
├── package.json          # Dependencies and scripts
├── .env.example          # Environment variables template
└── README.md             # This file
```

## Database Connection Pool

The server uses Oracle connection pooling for better performance:
- Minimum connections: 2
- Maximum connections: 10
- Connection increment: 1
- Pool timeout: 60 seconds

These settings can be adjusted in `db/oracle.js` if needed.

