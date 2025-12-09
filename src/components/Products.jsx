import { useState, useEffect } from 'react'
import api from '../services/api'
import '../components/CommonStyles.css'

export default function Products() {
  const [products, setProducts] = useState([])
  const [manufacturers, setManufacturers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    unit_price: '',
    is_bundle: 'N',
    manufacturer_id: ''
  })

  useEffect(() => {
    loadProducts()
    loadManufacturers()
  }, [])

  const loadProducts = () => {
    api.getProducts().then(setProducts)
  }

  const loadManufacturers = () => {
    api.getManufacturers().then(setManufacturers)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = {
      ...formData,
      unit_price: parseFloat(formData.unit_price),
      manufacturer_id: formData.manufacturer_id ? parseInt(formData.manufacturer_id) : null
    }
    if (editingProduct) {
      api.updateProduct(editingProduct.product_id, data)
        .then(() => {
          loadProducts()
          resetForm()
        })
    } else {
      api.createProduct(data)
        .then(() => {
          loadProducts()
          resetForm()
        })
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      sku: product.sku || '',
      name: product.name || '',
      description: product.description || '',
      unit_price: product.unit_price || '',
      is_bundle: product.is_bundle || 'N',
      manufacturer_id: product.manufacturer_id || ''
    })
    setShowForm(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      api.deleteProduct(id).then(loadProducts)
    }
  }

  const resetForm = () => {
    setFormData({
      sku: '',
      name: '',
      description: '',
      unit_price: '',
      is_bundle: 'N',
      manufacturer_id: ''
    })
    setEditingProduct(null)
    setShowForm(false)
  }

  return (
    <div>
      <div className="page-header">
        <h2>Products</h2>
        <p>Manage electronics product catalog including cameras, phones, computers, and accessories. Products can be organized by type, manufacturer, or bundled packages (e.g., Gateway PC with Sony monitor and HP printer).</p>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3>Product List</h3>
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
                <th>SKU</th>
                <th>Name</th>
                <th>Price</th>
                <th>Bundle</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.product_id}>
                  <td>{product.product_id}</td>
                  <td>{product.sku}</td>
                  <td>{product.name}</td>
                  <td>${product.unit_price?.toFixed(2)}</td>
                  <td>
                    <span className={`badge ${product.is_bundle === 'Y' ? 'badge-info' : 'badge-secondary'}`}>
                      {product.is_bundle === 'Y' ? 'Yes' : 'No'}
                    </span>
                  </td>
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
                <label>SKU</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Unit Price *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Is Bundle</label>
                <select
                  value={formData.is_bundle}
                  onChange={(e) => setFormData({ ...formData, is_bundle: e.target.value })}
                >
                  <option value="N">No</option>
                  <option value="Y">Yes</option>
                </select>
              </div>
              <div className="form-group">
                <label>Manufacturer</label>
                <select
                  value={formData.manufacturer_id}
                  onChange={(e) => setFormData({ ...formData, manufacturer_id: e.target.value })}
                >
                  <option value="">None</option>
                  {manufacturers.map(m => (
                    <option key={m.manufacturer_id} value={m.manufacturer_id}>
                      {m.name}
                    </option>
                  ))}
                </select>
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
  )
}

