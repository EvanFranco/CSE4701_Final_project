import { useState, useEffect } from 'react'
import api from '../services/api'
import '../components/CommonStyles.css'

export default function Accounts() {
  const [accounts, setAccounts] = useState([])
  const [customers, setCustomers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState(null)
  const [formData, setFormData] = useState({
    customer_id: '',
    account_number: '',
    credit_limit: '',
    current_balance: '0',
    opened_date: new Date().toISOString().slice(0, 10),
    status: 'ACTIVE'
  })

  useEffect(() => {
    loadAccounts()
    api.getCustomers().then(setCustomers)
  }, [])

  const loadAccounts = () => {
    api.getAccounts().then(setAccounts)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = {
      ...formData,
      customer_id: parseInt(formData.customer_id),
      credit_limit: formData.credit_limit ? parseFloat(formData.credit_limit) : null,
      current_balance: parseFloat(formData.current_balance) || 0,
      opened_date: formData.opened_date || null
    }
    if (editingAccount) {
      api.updateAccount(editingAccount.account_id, data)
        .then(() => {
          loadAccounts()
          resetForm()
        })
    } else {
      api.createAccount(data)
        .then(() => {
          loadAccounts()
          resetForm()
        })
    }
  }

  const handleEdit = (account) => {
    setEditingAccount(account)
    setFormData({
      customer_id: account.customer_id || '',
      account_number: account.account_number || '',
      credit_limit: account.credit_limit || '',
      current_balance: account.current_balance || '0',
      opened_date: account.opened_date ? new Date(account.opened_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      status: account.status || 'ACTIVE'
    })
    setShowForm(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      api.deleteAccount(id).then(loadAccounts)
    }
  }

  const resetForm = () => {
    setFormData({
      customer_id: '',
      account_number: '',
      credit_limit: '',
      current_balance: '0',
      opened_date: new Date().toISOString().slice(0, 10),
      status: 'ACTIVE'
    })
    setEditingAccount(null)
    setShowForm(false)
  }

  const getStatusBadge = (status) => {
    const badges = {
      'ACTIVE': 'badge-success',
      'CLOSED': 'badge-danger',
      'SUSPENDED': 'badge-warning'
    }
    return badges[status] || 'badge-secondary'
  }

  return (
    <div>
      <div className="page-header">
        <h2>Accounts</h2>
        <p>Manage contract customer accounts with monthly billing. Contract customers are billed to account numbers and have credit limits. Track account balances and payment status.</p>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3>Account List</h3>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Add Account
          </button>
        </div>
        {accounts.length === 0 ? (
          <div className="empty-state">
            <p>No accounts found. Add your first account!</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Account Number</th>
                <th>Customer ID</th>
                <th>Credit Limit</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(account => (
                <tr key={account.account_id}>
                  <td>{account.account_id}</td>
                  <td>{account.account_number}</td>
                  <td>{account.customer_id}</td>
                  <td>${account.credit_limit?.toFixed(2) || 'N/A'}</td>
                  <td>${account.current_balance?.toFixed(2)}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(account.status)}`}>
                      {account.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-secondary" onClick={() => handleEdit(account)} style={{ marginRight: '0.5rem' }}>
                      Edit
                    </button>
                    <button className="btn btn-danger" onClick={() => handleDelete(account.account_id)}>
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
              <h3>{editingAccount ? 'Edit Account' : 'Add Account'}</h3>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="form-container">
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
                <label>Account Number *</label>
                <input
                  type="text"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Credit Limit</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.credit_limit}
                  onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Current Balance</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.current_balance}
                  onChange={(e) => setFormData({ ...formData, current_balance: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Opened Date</label>
                <input
                  type="date"
                  value={formData.opened_date}
                  onChange={(e) => setFormData({ ...formData, opened_date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="CLOSED">Closed</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingAccount ? 'Update' : 'Create'}
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

