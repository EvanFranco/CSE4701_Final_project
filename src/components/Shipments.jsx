import { useState, useEffect } from 'react'
import api from '../services/api'
import '../components/CommonStyles.css'

export default function Shipments() {
  const [shipments, setShipments] = useState([])
  const [orders, setOrders] = useState([])
  const [showForm, setShowForm] = useState(false)
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
    api.getOrders().then(setOrders)
  }, [])

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
        resetForm()
      })
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
    setShowForm(false)
  }

  return (
    <div>
      <div className="page-header">
        <h2>Shipments</h2>
        <p>Manage online order shipments and tracking. All online sales must be shipped. Store tracking numbers from shipping companies to respond to customer inquiries about order status and delivery.</p>
      </div>

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
                <th>ID</th>
                <th>Order ID</th>
                <th>Shipper ID</th>
                <th>Tracking Number</th>
                <th>Ship Date</th>
                <th>Delivery Date</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map(shipment => (
                <tr key={shipment.shipment_id}>
                  <td>{shipment.shipment_id}</td>
                  <td>{shipment.order_id}</td>
                  <td>{shipment.shipper_id}</td>
                  <td>{shipment.tracking_number}</td>
                  <td>{shipment.ship_date ? new Date(shipment.ship_date).toLocaleDateString() : 'N/A'}</td>
                  <td>{shipment.delivery_date ? new Date(shipment.delivery_date).toLocaleDateString() : 'N/A'}</td>
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
              <h3>Add Shipment</h3>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="form-container">
              <div className="form-group">
                <label>Order *</label>
                <select
                  value={formData.order_id}
                  onChange={(e) => setFormData({ ...formData, order_id: e.target.value })}
                  required
                >
                  <option value="">Select Order</option>
                  {orders.map(o => (
                    <option key={o.order_id} value={o.order_id}>
                      Order #{o.order_id}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Shipper ID *</label>
                <input
                  type="number"
                  value={formData.shipper_id}
                  onChange={(e) => setFormData({ ...formData, shipper_id: e.target.value })}
                  required
                />
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

