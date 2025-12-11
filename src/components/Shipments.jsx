import { useState, useEffect } from 'react'
import api from '../services/api'
import '../components/CommonStyles.css'

export default function Shipments() {
  const [shipments, setShipments] = useState([])
  const [orders, setOrders] = useState([])
  const [pendingShipmentOrders, setPendingShipmentOrders] = useState([])
  const [shippers, setShippers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [formData, setFormData] = useState({
    order_id: '',
    shipper_id: '',
    tracking_number: '',
    ship_date: '',
    delivery_date: '',
    shipping_address: ''
  })

  useEffect(() => {
    loadShipments()
    loadPendingShipmentOrders()
    api.getOrders().then(setOrders)
    api.getShippers().then(setShippers)
  }, [])

  const loadPendingShipmentOrders = () => {
    api.getOnlineOrdersPendingShipment().then(setPendingShipmentOrders)
  }

  const loadShipments = () => {
    api.getShipments().then(setShipments)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = {
      ...formData,
      order_id: parseInt(formData.order_id),
      shipper_id: parseInt(formData.shipper_id),
      ship_date: formData.ship_date || null,
      delivery_date: formData.delivery_date || null
    }
    api.createShipment(data)
      .then(() => {
        loadShipments()
        loadPendingShipmentOrders() // Reload pending orders
        resetForm()
      })
      .catch(err => {
        alert('Error creating shipment: ' + (err.message || 'Unknown error'))
      })
  }

  const handleCreateFromPending = (order) => {
    setSelectedOrder(order)
    setFormData({
      order_id: order.order_id.toString(),
      shipper_id: '',
      tracking_number: '',
      ship_date: '',
      delivery_date: '',
      shipping_address: order.shipping_address || ''
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      order_id: '',
      shipper_id: '',
      tracking_number: '',
      ship_date: '',
      delivery_date: '',
      shipping_address: ''
    })
    setSelectedOrder(null)
    setShowForm(false)
  }

  return (
    <div>
      <div className="page-header">
        <h2>Shipments</h2>
        <p>Manage online order shipments and tracking. All online sales must be shipped. Store tracking numbers from shipping companies to respond to customer inquiries about order status and delivery.</p>
      </div>

      {/* Online Orders Pending Shipment Section */}
      {pendingShipmentOrders.length > 0 && (
        <div className="table-container" style={{ marginBottom: '2rem' }}>
          <div className="table-header">
            <h3>Online Orders Pending Shipment ({pendingShipmentOrders.length})</h3>
          </div>
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Order Date</th>
                <th>Customer</th>
                <th>Email</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingShipmentOrders.map(order => (
                <tr key={order.order_id}>
                  <td><strong>#{order.order_id}</strong></td>
                  <td>{order.order_datetime ? new Date(order.order_datetime).toLocaleDateString() : 'N/A'}</td>
                  <td>{order.customer_name || 'N/A'}</td>
                  <td>{order.customer_email || 'N/A'}</td>
                  <td>${order.total_amount?.toFixed(2) || '0.00'}</td>
                  <td>
                    <span className={`badge ${order.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>
                      {order.status || 'PENDING'}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => handleCreateFromPending(order)}
                    >
                      Create Shipment
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="table-container">
        <div className="table-header">
          <h3>Shipment List</h3>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Add Shipment
          </button>
        </div>
        {shipments.length === 0 ? (
          <div className="empty-state">
            <p>No shipments found. Add your first shipment!</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Shipment ID</th>
                <th>Order ID</th>
                <th>Shipper</th>
                <th>Tracking Number</th>
                <th>Ship Date</th>
                <th>Delivery Date</th>
                <th>Shipping Address</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map(shipment => (
                <tr key={shipment.shipment_id}>
                  <td><strong>#{shipment.shipment_id}</strong></td>
                  <td>Order #{shipment.order_id}</td>
                  <td>{shipment.shipper_name || `Shipper #${shipment.shipper_id}`}</td>
                  <td><strong>{shipment.tracking_number}</strong></td>
                  <td>{shipment.ship_date ? new Date(shipment.ship_date).toLocaleDateString() : 'N/A'}</td>
                  <td>{shipment.delivery_date ? new Date(shipment.delivery_date).toLocaleDateString() : 'N/A'}</td>
                  <td>{shipment.shipping_address || 'N/A'}</td>
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
              <h3>{selectedOrder ? `Create Shipment for Order #${selectedOrder.order_id}` : 'Add Shipment'}</h3>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="form-container">
              {selectedOrder && (
                <div style={{ 
                  padding: '10px', 
                  backgroundColor: '#e3f2fd', 
                  borderRadius: '4px', 
                  marginBottom: '15px',
                  fontSize: '14px'
                }}>
                  <strong>Order Details:</strong><br />
                  Customer: {selectedOrder.customer_name}<br />
                  Total: ${selectedOrder.total_amount?.toFixed(2) || '0.00'}<br />
                  Date: {selectedOrder.order_datetime ? new Date(selectedOrder.order_datetime).toLocaleDateString() : 'N/A'}
                </div>
              )}
              <div className="form-group">
                <label>Order *</label>
                <select
                  value={formData.order_id}
                  onChange={(e) => {
                    const order = orders.find(o => o.order_id === parseInt(e.target.value))
                    setFormData({ 
                      ...formData, 
                      order_id: e.target.value,
                      shipping_address: order?.shipping_address || formData.shipping_address
                    })
                    setSelectedOrder(order || null)
                  }}
                  required
                  disabled={!!selectedOrder}
                >
                  <option value="">Select Order</option>
                  {orders.filter(o => o.channel === 'ONLINE').map(o => (
                    <option key={o.order_id} value={o.order_id}>
                      Order #{o.order_id} - {o.customer_name || 'Customer'} (${o.total_amount?.toFixed(2) || '0.00'})
                    </option>
                  ))}
                </select>
                {selectedOrder && (
                  <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                    Order pre-selected from pending shipments
                  </small>
                )}
              </div>
              <div className="form-group">
                <label>Shipper *</label>
                <select
                  value={formData.shipper_id}
                  onChange={(e) => setFormData({ ...formData, shipper_id: e.target.value })}
                  required
                >
                  <option value="">Select Shipper</option>
                  {shippers.map(s => (
                    <option key={s.shipper_id} value={s.shipper_id}>
                      {s.name} {s.phone ? `(${s.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Tracking Number *</label>
                <input
                  type="text"
                  value={formData.tracking_number}
                  onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Ship Date</label>
                <input
                  type="date"
                  value={formData.ship_date}
                  onChange={(e) => setFormData({ ...formData, ship_date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Delivery Date</label>
                <input
                  type="date"
                  value={formData.delivery_date}
                  onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Shipping Address</label>
                <textarea
                  value={formData.shipping_address}
                  onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  Create
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

