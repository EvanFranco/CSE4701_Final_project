import { useState, useEffect } from 'react'
import api from '../services/api'
import '../components/CommonStyles.css'

export default function Accounts() {
  const [accounts, setAccounts] = useState([])
  const [customers, setCustomers] = useState([])
  const [accountOrders, setAccountOrders] = useState({})
  const [accountPayments, setAccountPayments] = useState({})
  const [expandedAccounts, setExpandedAccounts] = useState(new Set())
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

  const loadAccounts = async () => {
    const data = await api.getAccounts()
    setAccounts(data)
    // Load orders and payments for each account
    const ordersMap = {}
    const paymentsMap = {}
    for (const acc of data) {
      try {
        const [orders, payments] = await Promise.all([
          api.request(`/accounts/${acc.account_id}/orders`).catch(() => []),
          api.request(`/accounts/${acc.account_id}/payments`).catch(() => [])
        ])
        ordersMap[acc.account_id] = orders || []
        paymentsMap[acc.account_id] = payments || []
      } catch (err) {
        ordersMap[acc.account_id] = []
        paymentsMap[acc.account_id] = []
      }
    }
    setAccountOrders(ordersMap)
    setAccountPayments(paymentsMap)
  }

  const toggleExpand = (accountId) => {
    const newExpanded = new Set(expandedAccounts)
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId)
    } else {
      newExpanded.add(accountId)
    }
    setExpandedAccounts(newExpanded)
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
        <p>Manage contract customer accounts with monthly billing. Click on an account to see its orders and payments.</p>
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
                <th style={{ width: '30px' }}></th>
                <th>ID</th>
                <th>Account Number</th>
                <th>Customer ID</th>
                <th>Credit Limit</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Info</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(account => {
                const isExpanded = expandedAccounts.has(account.account_id)
                const orders = accountOrders[account.account_id] || []
                const payments = accountPayments[account.account_id] || []
                const hasData = orders.length > 0 || payments.length > 0
                
                return (
                  <>
                    <tr key={account.account_id} style={{ cursor: 'pointer' }} onClick={() => toggleExpand(account.account_id)}>
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
                      <td>{account.account_id}</td>
                      <td><strong>{account.account_number}</strong></td>
                      <td>{account.customer_id}</td>
                      <td>${account.credit_limit?.toFixed(2) || 'N/A'}</td>
                      <td>${account.current_balance?.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(account.status)}`}>
                          {account.status}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-info" style={{ marginRight: '5px' }}>
                          {orders.length} order{orders.length !== 1 ? 's' : ''}
                        </span>
                        <span className="badge badge-info">
                          {payments.length} payment{payments.length !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button className="btn btn-secondary" onClick={() => handleEdit(account)} style={{ marginRight: '0.5rem' }}>
                          Edit
                        </button>
                        <button className="btn btn-danger" onClick={() => handleDelete(account.account_id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                    {isExpanded && hasData && (
                      <tr>
                        <td colSpan="9" style={{ padding: '0', backgroundColor: '#f8f9fa' }}>
                          <div style={{ padding: '15px 40px', borderTop: '1px solid #dee2e6' }}>
                            {orders.length > 0 && (
                              <div style={{ marginBottom: '20px' }}>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#6c757d' }}>
                                  Orders ({orders.length}):
                                </h4>
                                <table style={{ width: '100%', fontSize: '13px', marginBottom: '15px' }}>
                                  <thead>
                                    <tr style={{ backgroundColor: '#e9ecef' }}>
                                      <th style={{ padding: '8px', textAlign: 'left' }}>Order ID</th>
                                      <th style={{ padding: '8px', textAlign: 'left' }}>Date</th>
                                      <th style={{ padding: '8px', textAlign: 'left' }}>Channel</th>
                                      <th style={{ padding: '8px', textAlign: 'right' }}>Total</th>
                                      <th style={{ padding: '8px', textAlign: 'left' }}>Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {orders.map(order => (
                                      <tr key={order.order_id} style={{ borderBottom: '1px solid #dee2e6' }}>
                                        <td style={{ padding: '8px' }}>{order.order_id}</td>
                                        <td style={{ padding: '8px' }}>{order.order_datetime ? new Date(order.order_datetime).toLocaleDateString() : 'N/A'}</td>
                                        <td style={{ padding: '8px' }}>{order.channel}</td>
                                        <td style={{ padding: '8px', textAlign: 'right' }}>${order.total_amount?.toFixed(2) || '0.00'}</td>
                                        <td style={{ padding: '8px' }}>{order.status || 'N/A'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                            {payments.length > 0 && (
                              <div>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#6c757d' }}>
                                  Payments ({payments.length}):
                                </h4>
                                <table style={{ width: '100%', fontSize: '13px' }}>
                                  <thead>
                                    <tr style={{ backgroundColor: '#e9ecef' }}>
                                      <th style={{ padding: '8px', textAlign: 'left' }}>Payment ID</th>
                                      <th style={{ padding: '8px', textAlign: 'left' }}>Order ID</th>
                                      <th style={{ padding: '8px', textAlign: 'left' }}>Method</th>
                                      <th style={{ padding: '8px', textAlign: 'right' }}>Amount</th>
                                      <th style={{ padding: '8px', textAlign: 'left' }}>Date</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {payments.map(payment => (
                                      <tr key={payment.payment_id} style={{ borderBottom: '1px solid #dee2e6' }}>
                                        <td style={{ padding: '8px' }}>{payment.payment_id}</td>
                                        <td style={{ padding: '8px' }}>{payment.order_id}</td>
                                        <td style={{ padding: '8px' }}>{payment.payment_method}</td>
                                        <td style={{ padding: '8px', textAlign: 'right' }}>${payment.amount?.toFixed(2)}</td>
                                        <td style={{ padding: '8px' }}>{payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : 'N/A'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                            {!hasData && (
                              <p style={{ margin: '0', color: '#6c757d', fontStyle: 'italic' }}>
                                No orders or payments found for this account.
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

