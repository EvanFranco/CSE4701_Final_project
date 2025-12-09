import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom'
import './App.css'
import Customers from './components/Customers'
import Products from './components/Products'
import Orders from './components/Orders'
import Inventory from './components/Inventory'
import Manufacturers from './components/Manufacturers'
import Categories from './components/Categories'
import Accounts from './components/Accounts'
import Payments from './components/Payments'
import Shipments from './components/Shipments'

function App() {
  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <h1>⚡ Electronics Vendor Management System</h1>
          <nav className="nav-menu">
            <NavLink to="/customers" className="nav-link">Customers</NavLink>
            <NavLink to="/products" className="nav-link">Products</NavLink>
            <NavLink to="/orders" className="nav-link">Orders</NavLink>
            <NavLink to="/inventory" className="nav-link">Inventory</NavLink>
            <NavLink to="/manufacturers" className="nav-link">Manufacturers</NavLink>
            <NavLink to="/categories" className="nav-link">Categories</NavLink>
            <NavLink to="/accounts" className="nav-link">Accounts</NavLink>
            <NavLink to="/payments" className="nav-link">Payments</NavLink>
            <NavLink to="/shipments" className="nav-link">Shipments</NavLink>
          </nav>
        </header>
        <main className="app-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/products" element={<Products />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/manufacturers" element={<Manufacturers />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/shipments" element={<Shipments />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

function Home() {
  return (
    <div className="page-header">
      <h2>Welcome to Electronics Vendor Management System</h2>
      <p>Manage your electronics retail operations across online and in-store channels. This system supports:</p>
      <ul style={{ marginTop: '1rem', lineHeight: '1.8', color: '#666' }}>
        <li><strong>Multi-channel Sales:</strong> Track both online and in-store orders</li>
        <li><strong>Product Management:</strong> Organize electronics by category, manufacturer, and bundles</li>
        <li><strong>Customer Accounts:</strong> Manage contract customers with monthly billing and one-time card payments</li>
        <li><strong>Inventory Control:</strong> Monitor stock levels across stores and warehouses with automatic reorder tracking</li>
        <li><strong>Shipping & Tracking:</strong> Handle online order fulfillment with shipment tracking</li>
        <li><strong>Sales Analytics:</strong> Access comprehensive sales data for planning and marketing</li>
      </ul>
      <p style={{ marginTop: '1.5rem', color: '#666' }}>Navigate using the menu above to access different management modules.</p>
    </div>
  )
}

export default App

