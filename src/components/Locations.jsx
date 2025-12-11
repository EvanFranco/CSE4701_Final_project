import { useState, useEffect } from 'react'
import api from '../services/api'
import '../components/CommonStyles.css'

export default function Locations() {
  const [locations, setLocations] = useState([])
  const [locationInventory, setLocationInventory] = useState({})
  const [locationOrders, setLocationOrders] = useState({})
  const [expandedLocations, setExpandedLocations] = useState(new Set())
  const [showForm, setShowForm] = useState(false)
  const [editingLocation, setEditingLocation] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    location_type: 'STORE',
    address: '',
    city: '',
    state: '',
    zip: '',
    region: ''
  })

  useEffect(() => {
    loadLocations()
  }, [])

  const loadLocations = async () => {
    const data = await api.getLocations()
    setLocations(data)
    // Load inventory and orders for each location
    const inventoryMap = {}
    const ordersMap = {}
    for (const loc of data) {
      try {
        const [inventory, orders] = await Promise.all([
          api.request(`/locations/${loc.location_id}/inventory`).catch(() => []),
          api.request(`/locations/${loc.location_id}/orders`).catch(() => [])
        ])
        inventoryMap[loc.location_id] = inventory || []
        ordersMap[loc.location_id] = orders || []
      } catch (err) {
        inventoryMap[loc.location_id] = []
        ordersMap[loc.location_id] = []
      }
    }
    setLocationInventory(inventoryMap)
    setLocationOrders(ordersMap)
  }

  const toggleExpand = (locationId) => {
    const newExpanded = new Set(expandedLocations)
    if (newExpanded.has(locationId)) {
      newExpanded.delete(locationId)
    } else {
      newExpanded.add(locationId)
    }
    setExpandedLocations(newExpanded)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = {
      ...formData,
      address: formData.address || null,
      city: formData.city || null,
      state: formData.state || null,
      zip: formData.zip || null,
      region: formData.region || null
    }
    if (editingLocation) {
      api.updateLocation(editingLocation.location_id, data)
        .then(() => {
          loadLocations()
          resetForm()
        })
    } else {
      api.createLocation(data)
        .then(() => {
          loadLocations()
          resetForm()
        })
    }
  }

  const handleEdit = (location) => {
    setEditingLocation(location)
    setFormData({
      name: location.name || '',
      location_type: location.location_type || 'STORE',
      address: location.address || '',
      city: location.city || '',
      state: location.state || '',
      zip: location.zip || '',
      region: location.region || ''
    })
    setShowForm(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this location? This will fail if there is inventory or orders associated with it.')) {
      api.deleteLocation(id)
        .then(() => {
          loadLocations()
        })
        .catch(err => {
          alert('Cannot delete location: ' + err.message)
        })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      location_type: 'STORE',
      address: '',
      city: '',
      state: '',
      zip: '',
      region: ''
    })
    setEditingLocation(null)
    setShowForm(false)
  }

  return (
    <div>
      <div className="page-header">
        <h2>Locations</h2>
        <p>Manage store and warehouse locations. Click on a location to see its inventory and orders.</p>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3>Location List</h3>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Add Location
          </button>
        </div>
        {locations.length === 0 ? (
          <div className="empty-state">
            <p>No locations found. Add your first location!</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: '30px' }}></th>
                <th>ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Address</th>
                <th>City</th>
                <th>State</th>
                <th>Info</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {locations.map(location => {
                const isExpanded = expandedLocations.has(location.location_id)
                const inventory = locationInventory[location.location_id] || []
                const orders = locationOrders[location.location_id] || []
                const hasData = inventory.length > 0 || orders.length > 0
                
                return (
                  <>
                    <tr key={location.location_id} style={{ cursor: 'pointer' }} onClick={() => toggleExpand(location.location_id)}>
                      <td>
                        <span style={{ 
                          display: 'inline-block',
                          width: '20px',
                          textAlign: 'center',
                          fontWeight: 'bold'
                        }}>
                          {hasData ? (isExpanded ? '▼' : '▶') : ''}
                        </span>
                      </td>
                      <td>{location.location_id}</td>
                      <td><strong>{location.name}</strong></td>
                      <td>
                        <span className={`badge ${location.location_type === 'WAREHOUSE' ? 'badge-info' : 'badge-success'}`}>
                          {location.location_type}
                        </span>
                      </td>
                      <td>{location.address || 'N/A'}</td>
                      <td>{location.city || 'N/A'}</td>
                      <td>{location.state || 'N/A'}</td>
                      <td>
                        <span className="badge badge-info" style={{ marginRight: '5px' }}>
                          {inventory.length} item{inventory.length !== 1 ? 's' : ''}
                        </span>
                        <span className="badge badge-info">
                          {orders.length} order{orders.length !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button className="btn btn-secondary" onClick={() => handleEdit(location)} style={{ marginRight: '0.5rem' }}>
                          Edit
                        </button>
                        <button className="btn btn-danger" onClick={() => handleDelete(location.location_id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                    {isExpanded && hasData && (
                      <tr>
                        <td colSpan="9" style={{ padding: '0', backgroundColor: '#f8f9fa' }}>
                          <div style={{ padding: '15px 40px', borderTop: '1px solid #dee2e6' }}>
                            {inventory.length > 0 && (
                              <div style={{ marginBottom: '20px' }}>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#6c757d' }}>
                                  Inventory ({inventory.length} items):
                                </h4>
                                <table style={{ width: '100%', fontSize: '13px', marginBottom: '15px' }}>
                                  <thead>
                                    <tr style={{ backgroundColor: '#e9ecef' }}>
                                      <th style={{ padding: '8px', textAlign: 'left' }}>Product ID</th>
                                      <th style={{ padding: '8px', textAlign: 'left' }}>Product Name</th>
                                      <th style={{ padding: '8px', textAlign: 'left' }}>SKU</th>
                                      <th style={{ padding: '8px', textAlign: 'right' }}>Qty on Hand</th>
                                      <th style={{ padding: '8px', textAlign: 'right' }}>Reorder Level</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {inventory.map(item => (
                                      <tr key={`${item.location_id}-${item.product_id}`} style={{ borderBottom: '1px solid #dee2e6' }}>
                                        <td style={{ padding: '8px' }}>{item.product_id}</td>
                                        <td style={{ padding: '8px' }}>{item.product_name || 'N/A'}</td>
                                        <td style={{ padding: '8px' }}>{item.sku || 'N/A'}</td>
                                        <td style={{ padding: '8px', textAlign: 'right' }}>{item.quantity_on_hand || 0}</td>
                                        <td style={{ padding: '8px', textAlign: 'right' }}>{item.reorder_level || 'N/A'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                            {orders.length > 0 && (
                              <div>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#6c757d' }}>
                                  Orders ({orders.length}):
                                </h4>
                                <table style={{ width: '100%', fontSize: '13px' }}>
                                  <thead>
                                    <tr style={{ backgroundColor: '#e9ecef' }}>
                                      <th style={{ padding: '8px', textAlign: 'left' }}>Order ID</th>
                                      <th style={{ padding: '8px', textAlign: 'left' }}>Date</th>
                                      <th style={{ padding: '8px', textAlign: 'left' }}>Customer</th>
                                      <th style={{ padding: '8px', textAlign: 'right' }}>Total</th>
                                      <th style={{ padding: '8px', textAlign: 'left' }}>Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {orders.map(order => (
                                      <tr key={order.order_id} style={{ borderBottom: '1px solid #dee2e6' }}>
                                        <td style={{ padding: '8px' }}>{order.order_id}</td>
                                        <td style={{ padding: '8px' }}>{order.order_datetime ? new Date(order.order_datetime).toLocaleDateString() : 'N/A'}</td>
                                        <td style={{ padding: '8px' }}>{order.first_name} {order.last_name}</td>
                                        <td style={{ padding: '8px', textAlign: 'right' }}>${order.total_amount?.toFixed(2) || '0.00'}</td>
                                        <td style={{ padding: '8px' }}>{order.status || 'N/A'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                            {!hasData && (
                              <p style={{ margin: '0', color: '#6c757d', fontStyle: 'italic' }}>
                                No inventory or orders found for this location.
                              </p>
                            )}
                          </div>
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
              <h3>{editingLocation ? 'Edit Location' : 'Add Location'}</h3>
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
                <label>Location Type *</label>
                <select
                  value={formData.location_type}
                  onChange={(e) => setFormData({ ...formData, location_type: e.target.value })}
                  required
                >
                  <option value="STORE">Store</option>
                  <option value="WAREHOUSE">Warehouse</option>
                </select>
              </div>
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>ZIP Code</label>
                <input
                  type="text"
                  value={formData.zip}
                  onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Region</label>
                <input
                  type="text"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingLocation ? 'Update' : 'Create'}
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



