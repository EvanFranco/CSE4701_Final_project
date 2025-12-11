import { useState, useEffect } from 'react'
import api from '../services/api'
import '../components/CommonStyles.css'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [customers, setCustomers] = useState([])
  const [accounts, setAccounts] = useState([])
  const [locations, setLocations] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingOrder, setEditingOrder] = useState(null)
  const [formData, setFormData] = useState({
    order_datetime: new Date().toISOString().slice(0, 16),
    channel: 'ONLINE',
    customer_id: '',
    account_id: '',
    location_id: '',
    total_amount: '',
    status: 'PENDING'
  })

  useEffect(() => {
    loadOrders()
    api.getCustomers().then(setCustomers)
    api.getAccounts().then(setAccounts)
    api.getLocations().then(setLocations)
  }, [])

  const loadOrders = () => {
    api.getOrders().then(setOrders)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = {
      ...formData,
      customer_id: parseInt(formData.customer_id),
      account_id: formData.account_id ? parseInt(formData.account_id) : null,
      location_id: formData.location_id ? parseInt(formData.location_id) : null,
      total_amount: formData.total_amount ? parseFloat(formData.total_amount) : 0
    }
    if (editingOrder) {
      api.updateOrder(editingOrder.order_id, data)
        .then(() => {
          loadOrders()
          resetForm()
        })
    } else {
      api.createOrder(data)
        .then(() => {
          loadOrders()
          resetForm()
        })
    }
  }

  const handleEdit = (order) => {
    setEditingOrder(order)
    setFormData({
      order_datetime: order.order_datetime ? new Date(order.order_datetime).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      channel: order.channel || 'ONLINE',
      customer_id: order.customer_id || '',
      account_id: order.account_id || '',
      location_id: order.location_id || '',
      total_amount: order.total_amount || '',
      status: order.status || 'PENDING'
    })
    setShowForm(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      api.deleteOrder(id).then(loadOrders)
    }
  }

  const resetForm = () => {
    setFormData({
      order_datetime: new Date().toISOString().slice(0, 16),
      channel: 'ONLINE',
      customer_id: '',
      account_id: '',
      location_id: '',
      total_amount: '',
      status: 'PENDING'
    })
    setEditingOrder(null)
    setShowForm(false)
  }

  const getStatusBadge = (status) => {
    const badges = {
      'PENDING': 'badge-warning',
      'COMPLETED': 'badge-success',
      'CANCELLED': 'badge-danger',
      'SHIPPED': 'badge-info'
    }
    return badges[status] || 'badge-secondary'
  }

  return (
    <div>
      <div className="page-header">
        <h2>Orders</h2>
        <p>Process and track customer orders from both online and in-store channels. Online orders require shipment tracking, while in-store orders are fulfilled directly at physical locations.</p>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3>Order List</h3>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Add Order
          </button>
        </div>
        {orders.length === 0 ? (
          <div className="empty-state">
            <p>No orders found. Create your first order!</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Channel</th>
                <th>Customer ID</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.order_id}>
                  <td>{order.order_id}</td>
                  <td>{order.order_datetime ? new Date(order.order_datetime).toLocaleString() : 'N/A'}</td>
                  <td>{order.channel}</td>
                  <td>{order.customer_id}</td>
                  <td>${order.total_amount?.toFixed(2)}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-secondary" onClick={() => handleEdit(order)} style={{ marginRight: '0.5rem' }}>
                      Edit
                    </button>
                    <button className="btn btn-danger" onClick={() => handleDelete(order.order_id)}>
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
              <h3>{editingOrder ? 'Edit Order' : 'Add Order'}</h3>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="form-container">
              <div className="form-group">
                <label>Order Date/Time *</label>
                <input
                  type="datetime-local"
                  value={formData.order_datetime}
                  onChange={(e) => setFormData({ ...formData, order_datetime: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Channel *</label>
                <select
                  value={formData.channel}
                  onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                  required
                >
                  <option value="ONLINE">Online</option>
                  <option value="INSTORE">In Store</option>
                </select>
              </div>
              <div className="form-group">
                <label>Customer *</label>
                <select
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  required
                >
                  <option value="">Select Customer</option>
                  {customers.map(c => (
                    <option key={c.customer_id} value={c.customer_id}>
                      {c.first_name} {c.last_name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Account</label>
                <select
                  value={formData.account_id}
                  onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                >
                  <option value="">None</option>
                  {accounts.map(a => (
                    <option key={a.account_id} value={a.account_id}>
                      {a.account_number} (Customer: {a.customer_id}, Balance: ${a.current_balance?.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Location</label>
                <select
                  value={formData.location_id}
                  onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                >
                  <option value="">None</option>
                  {locations.map(l => (
                    <option key={l.location_id} value={l.location_id}>
                      {l.name} ({l.location_type})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Total Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.total_amount}
                  onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="PENDING">Pending</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="SHIPPED">Shipped</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingOrder ? 'Update' : 'Create'}
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

