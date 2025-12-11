import { useState, useEffect } from 'react'
import api from '../services/api'
import '../components/CommonStyles.css'

export default function Shippers() {
  const [shippers, setShippers] = useState([])
  const [shipperShipments, setShipperShipments] = useState({})
  const [expandedShippers, setExpandedShippers] = useState(new Set())
  const [showForm, setShowForm] = useState(false)
  const [editingShipper, setEditingShipper] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    website: ''
  })

  useEffect(() => {
    loadShippers()
  }, [])

  const loadShippers = async () => {
    const data = await api.getShippers()
    setShippers(data)
    // Load shipments for each shipper
    const shipmentsMap = {}
    for (const shipper of data) {
      try {
        const shipments = await api.request(`/shippers/${shipper.shipper_id}/shipments`).catch(() => [])
        shipmentsMap[shipper.shipper_id] = shipments || []
      } catch (err) {
        shipmentsMap[shipper.shipper_id] = []
      }
    }
    setShipperShipments(shipmentsMap)
  }

  const toggleExpand = (shipperId) => {
    const newExpanded = new Set(expandedShippers)
    if (newExpanded.has(shipperId)) {
      newExpanded.delete(shipperId)
    } else {
      newExpanded.add(shipperId)
    }
    setExpandedShippers(newExpanded)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = {
      ...formData,
      phone: formData.phone || null,
      website: formData.website || null
    }
    if (editingShipper) {
      api.updateShipper(editingShipper.shipper_id, data)
        .then(() => {
          loadShippers()
          resetForm()
        })
        .catch(err => {
          alert('Error updating shipper: ' + (err.message || 'Unknown error'))
        })
    } else {
      api.createShipper(data)
        .then(() => {
          loadShippers()
          resetForm()
        })
        .catch(err => {
          alert('Error creating shipper: ' + (err.message || 'Unknown error'))
        })
    }
  }

  const handleEdit = (shipper) => {
    setEditingShipper(shipper)
    setFormData({
      name: shipper.name || '',
      phone: shipper.phone || '',
      website: shipper.website || ''
    })
    setShowForm(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this shipper? This will fail if there are shipments associated with it.')) {
      api.deleteShipper(id)
        .then(() => {
          loadShippers()
        })
        .catch(err => {
          alert('Cannot delete shipper: ' + (err.message || 'Unknown error'))
        })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      website: ''
    })
    setEditingShipper(null)
    setShowForm(false)
  }

  return (
    <div>
      <div className="page-header">
        <h2>Shippers</h2>
        <p>Manage shipping companies used for online order fulfillment. Click on a shipper to see their shipments.</p>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3>Shipper List</h3>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Add Shipper
          </button>
        </div>
        {shippers.length === 0 ? (
          <div className="empty-state">
            <p>No shippers found. Add your first shipper!</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: '30px' }}></th>
                <th>ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Website</th>
                <th>Info</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shippers.map(shipper => {
                const isExpanded = expandedShippers.has(shipper.shipper_id)
                const shipments = shipperShipments[shipper.shipper_id] || []
                const hasData = shipments.length > 0
                
                return (
                  <>
                    <tr key={shipper.shipper_id} style={{ cursor: 'pointer' }} onClick={() => toggleExpand(shipper.shipper_id)}>
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
                      <td>{shipper.shipper_id}</td>
                      <td><strong>{shipper.name}</strong></td>
                      <td>{shipper.phone || 'N/A'}</td>
                      <td>
                        {shipper.website ? (
                          <a href={shipper.website} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                            {shipper.website}
                          </a>
                        ) : 'N/A'}
                      </td>
                      <td>
                        <span className="badge badge-info">
                          {shipments.length} shipment{shipments.length !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button className="btn btn-secondary" onClick={() => handleEdit(shipper)} style={{ marginRight: '0.5rem' }}>
                          Edit
                        </button>
                        <button className="btn btn-danger" onClick={() => handleDelete(shipper.shipper_id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                    {isExpanded && hasData && (
                      <tr>
                        <td colSpan="7" style={{ padding: '0', backgroundColor: '#f8f9fa' }}>
                          <div style={{ padding: '15px 40px', borderTop: '1px solid #dee2e6' }}>
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#6c757d' }}>
                              Shipments by {shipper.name} ({shipments.length}):
                            </h4>
                            <table style={{ width: '100%', fontSize: '13px' }}>
                              <thead>
                                <tr style={{ backgroundColor: '#e9ecef' }}>
                                  <th style={{ padding: '8px', textAlign: 'left' }}>Shipment ID</th>
                                  <th style={{ padding: '8px', textAlign: 'left' }}>Order ID</th>
                                  <th style={{ padding: '8px', textAlign: 'left' }}>Tracking Number</th>
                                  <th style={{ padding: '8px', textAlign: 'left' }}>Order Date</th>
                                  <th style={{ padding: '8px', textAlign: 'right' }}>Order Total</th>
                                  <th style={{ padding: '8px', textAlign: 'left' }}>Ship Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {shipments.map(shipment => (
                                  <tr key={shipment.shipment_id} style={{ borderBottom: '1px solid #dee2e6' }}>
                                    <td style={{ padding: '8px' }}>#{shipment.shipment_id}</td>
                                    <td style={{ padding: '8px' }}>Order #{shipment.order_id}</td>
                                    <td style={{ padding: '8px' }}><strong>{shipment.tracking_number}</strong></td>
                                    <td style={{ padding: '8px' }}>{shipment.order_datetime ? new Date(shipment.order_datetime).toLocaleDateString() : 'N/A'}</td>
                                    <td style={{ padding: '8px', textAlign: 'right' }}>${shipment.order_total?.toFixed(2) || '0.00'}</td>
                                    <td style={{ padding: '8px' }}>{shipment.ship_date ? new Date(shipment.ship_date).toLocaleDateString() : 'N/A'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                    {isExpanded && shipments.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ padding: '15px 40px', backgroundColor: '#f8f9fa', borderTop: '1px solid #dee2e6' }}>
                          <p style={{ margin: '0', color: '#6c757d', fontStyle: 'italic' }}>
                            No shipments found for this shipper.
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
              <h3>{editingShipper ? 'Edit Shipper' : 'Add Shipper'}</h3>
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
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="form-group">
                <label>Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingShipper ? 'Update' : 'Create'}
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



