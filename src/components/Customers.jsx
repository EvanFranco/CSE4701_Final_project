import { useState, useEffect } from 'react'
import api from '../services/api'
import '../components/CommonStyles.css'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [customerAccounts, setCustomerAccounts] = useState({})
  const [customerOrders, setCustomerOrders] = useState({})
  const [customerCards, setCustomerCards] = useState({})
  const [expandedCustomers, setExpandedCustomers] = useState(new Set())
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

  const loadCustomers = async () => {
    const data = await api.getCustomers()
    setCustomers(data)
    // Load related data for each customer
    const accountsMap = {}
    const ordersMap = {}
    const cardsMap = {}
    for (const cust of data) {
      try {
        const [accounts, orders, cards] = await Promise.all([
          api.request(`/customers/${cust.customer_id}/accounts`).catch(() => []),
          api.request(`/customers/${cust.customer_id}/orders`).catch(() => []),
          api.request(`/customers/${cust.customer_id}/payment-cards`).catch(() => [])
        ])
        accountsMap[cust.customer_id] = accounts || []
        ordersMap[cust.customer_id] = orders || []
        cardsMap[cust.customer_id] = cards || []
      } catch (err) {
        accountsMap[cust.customer_id] = []
        ordersMap[cust.customer_id] = []
        cardsMap[cust.customer_id] = []
      }
    }
    setCustomerAccounts(accountsMap)
    setCustomerOrders(ordersMap)
    setCustomerCards(cardsMap)
  }

  const toggleExpand = (customerId) => {
    const newExpanded = new Set(expandedCustomers)
    if (newExpanded.has(customerId)) {
      newExpanded.delete(customerId)
    } else {
      newExpanded.add(customerId)
    }
    setExpandedCustomers(newExpanded)
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
        <p>Manage customer information for both contract customers (monthly billing) and one-time purchasers. Click on a customer to see their accounts, orders, and payment cards.</p>
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
                <th style={{ width: '30px' }}></th>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Contract</th>
                <th>Info</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(customer => {
                const isExpanded = expandedCustomers.has(customer.customer_id)
                const accounts = customerAccounts[customer.customer_id] || []
                const orders = customerOrders[customer.customer_id] || []
                const cards = customerCards[customer.customer_id] || []
                const hasData = accounts.length > 0 || orders.length > 0 || cards.length > 0
                
                return (
                  <>
                    <tr key={customer.customer_id} style={{ cursor: 'pointer' }} onClick={() => toggleExpand(customer.customer_id)}>
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
                      <td>{customer.customer_id}</td>
                      <td><strong>{customer.first_name} {customer.last_name}</strong></td>
                      <td>{customer.email}</td>
                      <td>{customer.phone || 'N/A'}</td>
                      <td>
                        <span className={`badge ${customer.contract_flag === 'Y' ? 'badge-success' : 'badge-secondary'}`}>
                          {customer.contract_flag === 'Y' ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-info" style={{ marginRight: '5px' }}>
                          {accounts.length} account{accounts.length !== 1 ? 's' : ''}
                        </span>
                        <span className="badge badge-info" style={{ marginRight: '5px' }}>
                          {orders.length} order{orders.length !== 1 ? 's' : ''}
                        </span>
                        <span className="badge badge-info">
                          {cards.length} card{cards.length !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button className="btn btn-secondary" onClick={() => handleEdit(customer)} style={{ marginRight: '0.5rem' }}>
                          Edit
                        </button>
                        <button className="btn btn-danger" onClick={() => handleDelete(customer.customer_id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                    {isExpanded && hasData && (
                      <tr>
                        <td colSpan="8" style={{ padding: '0', backgroundColor: '#f8f9fa' }}>
                          <div style={{ padding: '15px 40px', borderTop: '1px solid #dee2e6' }}>
                            {accounts.length > 0 && (
                              <div style={{ marginBottom: '20px' }}>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#6c757d' }}>
                                  Accounts ({accounts.length}):
                                </h4>
                                <table style={{ width: '100%', fontSize: '13px', marginBottom: '15px' }}>
                                  <thead>
                                    <tr style={{ backgroundColor: '#e9ecef' }}>
                                      <th style={{ padding: '8px', textAlign: 'left' }}>Account #</th>
                                      <th style={{ padding: '8px', textAlign: 'right' }}>Credit Limit</th>
                                      <th style={{ padding: '8px', textAlign: 'right' }}>Balance</th>
                                      <th style={{ padding: '8px', textAlign: 'left' }}>Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {accounts.map(account => (
                                      <tr key={account.account_id} style={{ borderBottom: '1px solid #dee2e6' }}>
                                        <td style={{ padding: '8px' }}>{account.account_number}</td>
                                        <td style={{ padding: '8px', textAlign: 'right' }}>${account.credit_limit?.toFixed(2) || 'N/A'}</td>
                                        <td style={{ padding: '8px', textAlign: 'right' }}>${account.current_balance?.toFixed(2)}</td>
                                        <td style={{ padding: '8px' }}>{account.status || 'N/A'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
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
                            {cards.length > 0 && (
                              <div>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#6c757d' }}>
                                  Payment Cards ({cards.length}):
                                </h4>
                                <table style={{ width: '100%', fontSize: '13px' }}>
                                  <thead>
                                    <tr style={{ backgroundColor: '#e9ecef' }}>
                                      <th style={{ padding: '8px', textAlign: 'left' }}>Card ID</th>
                                      <th style={{ padding: '8px', textAlign: 'left' }}>Type</th>
                                      <th style={{ padding: '8px', textAlign: 'left' }}>Masked Number</th>
                                      <th style={{ padding: '8px', textAlign: 'left' }}>Expiry</th>
                                      <th style={{ padding: '8px', textAlign: 'center' }}>Default</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {cards.map(card => (
                                      <tr key={card.card_id} style={{ borderBottom: '1px solid #dee2e6' }}>
                                        <td style={{ padding: '8px' }}>{card.card_id}</td>
                                        <td style={{ padding: '8px' }}>{card.card_type || 'N/A'}</td>
                                        <td style={{ padding: '8px' }}>{card.masked_number || 'N/A'}</td>
                                        <td style={{ padding: '8px' }}>{card.expiry_month && card.expiry_year ? `${card.expiry_month}/${card.expiry_year}` : 'N/A'}</td>
                                        <td style={{ padding: '8px', textAlign: 'center' }}>{card.is_default === 'Y' ? 'Yes' : 'No'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                            {!hasData && (
                              <p style={{ margin: '0', color: '#6c757d', fontStyle: 'italic' }}>
                                No accounts, orders, or payment cards found for this customer.
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

