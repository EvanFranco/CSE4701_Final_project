import { useState, useEffect } from 'react'
import api from '../services/api'
import '../components/CommonStyles.css'

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [orders, setOrders] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    order_id: '',
    payment_method: 'CARD',
    amount: '',
    payment_date: new Date().toISOString().slice(0, 10),
    card_id: '',
    account_id: ''
  })

  useEffect(() => {
    loadPayments()
    api.getOrders().then(setOrders)
  }, [])

  const loadPayments = () => {
    api.getPayments().then(setPayments)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = {
      ...formData,
      order_id: parseInt(formData.order_id),
      amount: parseFloat(formData.amount),
      payment_date: formData.payment_date,
      card_id: formData.card_id ? parseInt(formData.card_id) : null,
      account_id: formData.account_id ? parseInt(formData.account_id) : null
    }
    api.createPayment(data)
      .then(() => {
        loadPayments()
        resetForm()
      })
  }

  const resetForm = () => {
    setFormData({
      order_id: '',
      payment_method: 'CARD',
      amount: '',
      payment_date: new Date().toISOString().slice(0, 10),
      card_id: '',
      account_id: ''
    })
    setShowForm(false)
  }

  return (
    <div>
      <div className="page-header">
        <h2>Payments</h2>
        <p>Process payments for orders. Contract customers can pay via account billing, while other customers pay with credit/debit cards. Card information may be stored for online customers but not for in-store transactions.</p>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3>Payment List</h3>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Add Payment
          </button>
        </div>
        {payments.length === 0 ? (
          <div className="empty-state">
            <p>No payments found. Add your first payment!</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Order ID</th>
                <th>Payment Method</th>
                <th>Amount</th>
                <th>Payment Date</th>
                <th>Card ID</th>
                <th>Account ID</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.payment_id}>
                  <td>{payment.payment_id}</td>
                  <td>{payment.order_id}</td>
                  <td>{payment.payment_method}</td>
                  <td>${payment.amount?.toFixed(2)}</td>
                  <td>{payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : 'N/A'}</td>
                  <td>{payment.card_id || 'N/A'}</td>
                  <td>{payment.account_id || 'N/A'}</td>
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
              <h3>Add Payment</h3>
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
                      Order #{o.order_id} - ${o.total_amount?.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Payment Method *</label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  required
                >
                  <option value="CARD">Card</option>
                  <option value="ACCOUNT">Account</option>
                  <option value="CASH">Cash</option>
                </select>
              </div>
              <div className="form-group">
                <label>Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Payment Date *</label>
                <input
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Card ID</label>
                <input
                  type="number"
                  value={formData.card_id}
                  onChange={(e) => setFormData({ ...formData, card_id: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Account ID</label>
                <input
                  type="number"
                  value={formData.account_id}
                  onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
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

