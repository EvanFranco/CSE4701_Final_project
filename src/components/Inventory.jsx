import { useState, useEffect } from 'react'
import api from '../services/api'
import '../components/CommonStyles.css'

export default function Inventory() {
  const [inventory, setInventory] = useState([])
  const [products, setProducts] = useState([])
  const [locations, setLocations] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    location_id: '',
    product_id: '',
    quantity_on_hand: '0',
    reorder_level: '',
    reorder_quantity: ''
  })

  useEffect(() => {
    loadInventory()
    api.getProducts().then(setProducts)
    api.getLocations().then(setLocations)
  }, [])

  const loadInventory = () => {
    api.getInventory().then(setInventory)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = {
      location_id: parseInt(formData.location_id),
      product_id: parseInt(formData.product_id),
      quantity_on_hand: parseInt(formData.quantity_on_hand) || 0,
      reorder_level: formData.reorder_level ? parseInt(formData.reorder_level) : null,
      reorder_quantity: formData.reorder_quantity ? parseInt(formData.reorder_quantity) : null
    }
    if (editingItem) {
      api.updateInventory(editingItem.location_id, editingItem.product_id, data)
        .then(() => {
          loadInventory()
          resetForm()
        })
    } else {
      api.createInventory(data)
        .then(() => {
          loadInventory()
          resetForm()
        })
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      location_id: item.location_id || '',
      product_id: item.product_id || '',
      quantity_on_hand: item.quantity_on_hand || '0',
      reorder_level: item.reorder_level || '',
      reorder_quantity: item.reorder_quantity || ''
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      location_id: '',
      product_id: '',
      quantity_on_hand: '0',
      reorder_level: '',
      reorder_quantity: ''
    })
    setEditingItem(null)
    setShowForm(false)
  }

  return (
    <div>
      <div className="page-header">
        <h2>Inventory</h2>
        <p>Monitor inventory levels across physical stores and warehouses. When stock falls below reorder levels, the system tracks reorder requests to manufacturers. Update inventory when goods arrive from manufacturers.</p>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3>Inventory List</h3>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Add Inventory
          </button>
        </div>
        {inventory.length === 0 ? (
          <div className="empty-state">
            <p>No inventory records found. Add your first inventory item!</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Location ID</th>
                <th>Product ID</th>
                <th>Product Name</th>
                <th>Qty on Hand</th>
                <th>Reorder Level</th>
                <th>Reorder Qty</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map(item => {
                const product = products.find(p => p.product_id === item.product_id)
                return (
                  <tr key={`${item.location_id}-${item.product_id}`}>
                    <td>{item.location_id}</td>
                    <td>{item.product_id}</td>
                    <td>{product?.name || 'N/A'}</td>
                    <td>
                      <span className={item.quantity_on_hand <= (item.reorder_level || 0) ? 'badge badge-warning' : ''}>
                        {item.quantity_on_hand}
                      </span>
                    </td>
                    <td>{item.reorder_level || 'N/A'}</td>
                    <td>{item.reorder_quantity || 'N/A'}</td>
                    <td>
                      <button className="btn btn-secondary" onClick={() => handleEdit(item)}>
                        Edit
                      </button>
                    </td>
                  </tr>
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
              <h3>{editingItem ? 'Edit Inventory' : 'Add Inventory'}</h3>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="form-container">
              <div className="form-group">
                <label>Location *</label>
                <select
                  value={formData.location_id}
                  onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                  required
                >
                  <option value="">Select Location</option>
                  {locations.map(l => (
                    <option key={l.location_id} value={l.location_id}>
                      {l.name} ({l.location_type})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Product *</label>
                <select
                  value={formData.product_id}
                  onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                  required
                >
                  <option value="">Select Product</option>
                  {products.map(p => (
                    <option key={p.product_id} value={p.product_id}>
                      {p.name} (SKU: {p.sku})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Quantity on Hand</label>
                <input
                  type="number"
                  value={formData.quantity_on_hand}
                  onChange={(e) => setFormData({ ...formData, quantity_on_hand: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Reorder Level</label>
                <input
                  type="number"
                  value={formData.reorder_level}
                  onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Reorder Quantity</label>
                <input
                  type="number"
                  value={formData.reorder_quantity}
                  onChange={(e) => setFormData({ ...formData, reorder_quantity: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Update' : 'Create'}
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

