import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../components/CommonStyles.css';

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    unit_price: '',
    manufacturer_id: ''
  });
  const warehouseId = localStorage.getItem('warehouse_id');
  const employeeRole = localStorage.getItem('employee_role');

  useEffect(() => {
    if (!warehouseId) {
      navigate('/login');
      return;
    }
    loadProducts();
  }, [warehouseId, navigate]);

  const loadProducts = async () => {
    try {
      const allProducts = await api.getProducts();
      setProducts(allProducts);
    } catch (err) {
      console.error('Error loading products:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        ...formData,
        unit_price: parseFloat(formData.unit_price),
        manufacturer_id: formData.manufacturer_id ? parseInt(formData.manufacturer_id) : null
      };

      if (editingProduct) {
        await api.updateProduct(editingProduct.product_id, productData);
      } else {
        await api.createProduct(productData);
      }
      
      loadProducts();
      resetForm();
    } catch (err) {
      alert(err.message || 'Error saving product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku || '',
      name: product.name || '',
      description: product.description || '',
      unit_price: product.unit_price || '',
      manufacturer_id: product.manufacturer_id || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.deleteProduct(id);
        loadProducts();
      } catch (err) {
        alert('Error deleting product');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      sku: '',
      name: '',
      description: '',
      unit_price: '',
      manufacturer_id: ''
    });
    setEditingProduct(null);
    setShowForm(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('employee_id');
    localStorage.removeItem('warehouse_id');
    localStorage.removeItem('employee_role');
    localStorage.removeItem('user_type');
    navigate('/login');
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Employee Dashboard - Product Management</h2>
          <p>Manage electronics product inventory for your warehouse location</p>
        </div>
        <button className="btn btn-secondary" onClick={handleLogout}>Logout</button>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3>Products in Stock</h3>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Add Product
          </button>
        </div>
        {products.length === 0 ? (
          <div className="empty-state">
            <p>No products found. Add your first product!</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Manufacturer</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.product_id}>
                  <td>{product.product_id}</td>
                  <td>{product.name}</td>
                  <td>{product.sku || 'N/A'}</td>
                  <td>${product.unit_price ? parseFloat(product.unit_price).toFixed(2) : '0.00'}</td>
                  <td>{product.manufacturer_id || 'N/A'}</td>
                  <td>
                    <button className="btn btn-secondary" onClick={() => handleEdit(product)} style={{ marginRight: '0.5rem' }}>
                      Edit
                    </button>
                    <button className="btn btn-danger" onClick={() => handleDelete(product.product_id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingProduct ? 'Edit Product' : 'Add Product'}</h3>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="form-container">
              <div className="form-group">
                <label>Product Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>SKU</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Price *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Manufacturer ID</label>
                <input
                  type="number"
                  value={formData.manufacturer_id}
                  onChange={(e) => setFormData({ ...formData, manufacturer_id: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Update' : 'Create'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
