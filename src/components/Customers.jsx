import { useState, useEffect } from 'react'
import api from '../services/api'
import '../components/CommonStyles.css'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    billing_address: '',
    shipping_address: '',
    contract_flag: 'N'
  })

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = () => {
    api.getCustomers().then(setCustomers)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingCustomer) {
      api.updateCustomer(editingCustomer.customer_id, formData)
        .then(() => {
          loadCustomers()
          resetForm()
        })
    } else {
      api.createCustomer(formData)
        .then(() => {
          loadCustomers()
          resetForm()
        })
    }
  }

  const handleEdit = (customer) => {
    setEditingCustomer(customer)
    setFormData({
      first_name: customer.first_name || '',
      last_name: customer.last_name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      billing_address: customer.billing_address || '',
      shipping_address: customer.shipping_address || '',
      contract_flag: customer.contract_flag || 'N'
    })
    setShowForm(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      api.deleteCustomer(id).then(loadCustomers)
    }
  }

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      billing_address: '',
      shipping_address: '',
      contract_flag: 'N'
    })
    setEditingCustomer(null)
    setShowForm(false)
  }

  return (
    <div>
      <div className="page-header">
        <h2>Customers</h2>
        <p>Manage customer information for both contract customers (monthly billing) and one-time purchasers. Contract customers can be billed to account numbers, while other customers pay with credit/debit cards.</p>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3>Customer List</h3>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Add Customer
          </button>
        </div>
        {customers.length === 0 ? (
          <div className="empty-state">
            <p>No customers found. Add your first customer!</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Contract</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(customer => (
                <tr key={customer.customer_id}>
                  <td>{customer.customer_id}</td>
                  <td>{customer.first_name} {customer.last_name}</td>
                  <td>{customer.email}</td>
                  <td>{customer.phone}</td>
                  <td>
                    <span className={`badge ${customer.contract_flag === 'Y' ? 'badge-success' : 'badge-secondary'}`}>
                      {customer.contract_flag === 'Y' ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-secondary" onClick={() => handleEdit(customer)} style={{ marginRight: '0.5rem' }}>
                      Edit
                    </button>
                    <button className="btn btn-danger" onClick={() => handleDelete(customer.customer_id)}>
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
              <h3>{editingCustomer ? 'Edit Customer' : 'Add Customer'}</h3>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="form-container">
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Billing Address</label>
                <textarea
                  value={formData.billing_address}
                  onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Shipping Address</label>
                <textarea
                  value={formData.shipping_address}
                  onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Contract Flag</label>
                <select
                  value={formData.contract_flag}
                  onChange={(e) => setFormData({ ...formData, contract_flag: e.target.value })}
                >
                  <option value="N">No</option>
                  <option value="Y">Yes</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingCustomer ? 'Update' : 'Create'}
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

