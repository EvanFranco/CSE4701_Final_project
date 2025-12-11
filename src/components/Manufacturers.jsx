import { useState, useEffect } from 'react'
import api from '../services/api'
import '../components/CommonStyles.css'

export default function Manufacturers() {
  const [manufacturers, setManufacturers] = useState([])
  const [manufacturerProducts, setManufacturerProducts] = useState({})
  const [expandedManufacturers, setExpandedManufacturers] = useState(new Set())
  const [showForm, setShowForm] = useState(false)
  const [editingManufacturer, setEditingManufacturer] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    country: ''
  })

  useEffect(() => {
    loadManufacturers()
  }, [])

  const loadManufacturers = async () => {
    const data = await api.getManufacturers()
    setManufacturers(data)
    // Load products for each manufacturer
    const productsMap = {}
    for (const mfg of data) {
      try {
        const products = await api.request(`/manufacturers/${mfg.manufacturer_id}/products`)
        productsMap[mfg.manufacturer_id] = products || []
      } catch (err) {
        productsMap[mfg.manufacturer_id] = []
      }
    }
    setManufacturerProducts(productsMap)
  }

  const toggleExpand = (manufacturerId) => {
    const newExpanded = new Set(expandedManufacturers)
    if (newExpanded.has(manufacturerId)) {
      newExpanded.delete(manufacturerId)
    } else {
      newExpanded.add(manufacturerId)
    }
    setExpandedManufacturers(newExpanded)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingManufacturer) {
      api.updateManufacturer(editingManufacturer.manufacturer_id, formData)
        .then(() => {
          loadManufacturers()
          resetForm()
        })
    } else {
      api.createManufacturer(formData)
        .then(() => {
          loadManufacturers()
          resetForm()
        })
    }
  }

  const handleEdit = (manufacturer) => {
    setEditingManufacturer(manufacturer)
    setFormData({
      name: manufacturer.name || '',
      country: manufacturer.country || ''
    })
    setShowForm(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this manufacturer?')) {
      api.deleteManufacturer(id).then(loadManufacturers)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      country: ''
    })
    setEditingManufacturer(null)
    setShowForm(false)
  }

  return (
    <div>
      <div className="page-header">
        <h2>Manufacturers</h2>
        <p>Manage electronics manufacturers such as Sony, Apple, HP, Gateway, and others. Click on a manufacturer to see their products.</p>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3>Manufacturer List</h3>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Add Manufacturer
          </button>
        </div>
        {manufacturers.length === 0 ? (
          <div className="empty-state">
            <p>No manufacturers found. Add your first manufacturer!</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: '30px' }}></th>
                <th>ID</th>
                <th>Name</th>
                <th>Country</th>
                <th>Products</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {manufacturers.map(manufacturer => {
                const isExpanded = expandedManufacturers.has(manufacturer.manufacturer_id)
                const products = manufacturerProducts[manufacturer.manufacturer_id] || []
                
                return (
                  <>
                    <tr key={manufacturer.manufacturer_id} style={{ cursor: 'pointer' }} onClick={() => toggleExpand(manufacturer.manufacturer_id)}>
                      <td>
                        <span style={{ 
                          display: 'inline-block',
                          width: '20px',
                          textAlign: 'center',
                          fontWeight: 'bold'
                        }}>
                          {products.length > 0 ? (isExpanded ? '▼' : '▶') : ''}
                        </span>
                      </td>
                      <td>{manufacturer.manufacturer_id}</td>
                      <td><strong>{manufacturer.name}</strong></td>
                      <td>{manufacturer.country || 'N/A'}</td>
                      <td>
                        <span className="badge badge-info">
                          {products.length} product{products.length !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button className="btn btn-secondary" onClick={() => handleEdit(manufacturer)} style={{ marginRight: '0.5rem' }}>
                          Edit
                        </button>
                        <button className="btn btn-danger" onClick={() => handleDelete(manufacturer.manufacturer_id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                    {isExpanded && products.length > 0 && (
                      <tr>
                        <td colSpan="6" style={{ padding: '0', backgroundColor: '#f8f9fa' }}>
                          <div style={{ padding: '15px 40px', borderTop: '1px solid #dee2e6' }}>
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#6c757d' }}>
                              Products by {manufacturer.name}:
                            </h4>
                            <table style={{ width: '100%', fontSize: '13px' }}>
                              <thead>
                                <tr style={{ backgroundColor: '#e9ecef' }}>
                                  <th style={{ padding: '8px', textAlign: 'left' }}>Product ID</th>
                                  <th style={{ padding: '8px', textAlign: 'left' }}>SKU</th>
                                  <th style={{ padding: '8px', textAlign: 'left' }}>Name</th>
                                  <th style={{ padding: '8px', textAlign: 'right' }}>Price</th>
                                  <th style={{ padding: '8px', textAlign: 'center' }}>Orders</th>
                                  <th style={{ padding: '8px', textAlign: 'right' }}>Qty Sold</th>
                                </tr>
                              </thead>
                              <tbody>
                                {products.map(product => (
                                  <tr key={product.product_id} style={{ borderBottom: '1px solid #dee2e6' }}>
                                    <td style={{ padding: '8px' }}>{product.product_id}</td>
                                    <td style={{ padding: '8px' }}>{product.sku || 'N/A'}</td>
                                    <td style={{ padding: '8px' }}>{product.name}</td>
                                    <td style={{ padding: '8px', textAlign: 'right' }}>${product.unit_price?.toFixed(2)}</td>
                                    <td style={{ padding: '8px', textAlign: 'center' }}>{product.order_count || 0}</td>
                                    <td style={{ padding: '8px', textAlign: 'right' }}>{product.total_quantity_sold || 0}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                    {isExpanded && products.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ padding: '15px 40px', backgroundColor: '#f8f9fa', borderTop: '1px solid #dee2e6' }}>
                          <p style={{ margin: '0', color: '#6c757d', fontStyle: 'italic' }}>
                            No products found for this manufacturer.
                          </p>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingManufacturer ? 'Edit Manufacturer' : 'Add Manufacturer'}</h3>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="form-container">
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
                <label>Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingManufacturer ? 'Update' : 'Create'}
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

