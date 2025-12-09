// API service that connects to backend REST API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // Remove Content-Type header if body is FormData
    if (options.body instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }
      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return await response.text();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Generic CRUD operations
  getAll(entity) {
    return this.request(`/${entity}`);
  }

  getById(entity, id) {
    return this.request(`/${entity}/${id}`);
  }

  create(entity, item) {
    return this.request(`/${entity}`, {
      method: 'POST',
      body: JSON.stringify(item)
    });
  }

  update(entity, id, updates) {
    return this.request(`/${entity}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  delete(entity, id) {
    return this.request(`/${entity}/${id}`, {
      method: 'DELETE'
    });
  }

  // Specific entity methods
  getCustomers() { return this.getAll('customers') }
  getCustomer(id) { return this.getById('customers', id) }
  createCustomer(customer) { return this.create('customers', customer) }
  updateCustomer(id, updates) { return this.update('customers', id, updates) }
  deleteCustomer(id) { return this.delete('customers', id) }

  getProducts() { return this.getAll('products') }
  getProduct(id) { return this.getById('products', id) }
  createProduct(product) { return this.create('products', product) }
  updateProduct(id, updates) { return this.update('products', id, updates) }
  deleteProduct(id) { return this.delete('products', id) }

  getOrders() { return this.getAll('orders') }
  getOrder(id) { return this.getById('orders', id) }
  createOrder(order) { return this.create('orders', order) }
  updateOrder(id, updates) { return this.update('orders', id, updates) }
  deleteOrder(id) { return this.delete('orders', id) }

  getInventory() { return this.getAll('inventory') }
  createInventory(inventory) { return this.create('inventory', inventory) }
  updateInventory(locationId, productId, updates) {
    return this.request(`/inventory/${locationId}/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  getManufacturers() { return this.getAll('manufacturers') }
  createManufacturer(manufacturer) { return this.create('manufacturers', manufacturer) }
  updateManufacturer(id, updates) { return this.update('manufacturers', id, updates) }
  deleteManufacturer(id) { return this.delete('manufacturers', id) }

  getCategories() { return this.getAll('categories') }
  createCategory(category) { return this.create('categories', category) }
  updateCategory(id, updates) { return this.update('categories', id, updates) }
  deleteCategory(id) { return this.delete('categories', id) }

  getAccounts() { return this.getAll('accounts') }
  createAccount(account) { return this.create('accounts', account) }
  updateAccount(id, updates) { return this.update('accounts', id, updates) }
  deleteAccount(id) { return this.delete('accounts', id) }

  getPayments() { return this.getAll('payments') }
  createPayment(payment) { return this.create('payments', payment) }

  getShipments() { return this.getAll('shipments') }
  createShipment(shipment) { return this.create('shipments', shipment) }
}

export default new ApiService()

