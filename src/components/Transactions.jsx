import { useEffect, useState } from 'react'
import api from '../services/api'
import '../components/CommonStyles.css'

export default function Transactions() {
  const [customers, setCustomers] = useState([])
  const [accounts, setAccounts] = useState([])
  const [products, setProducts] = useState([])
  const [inventory, setInventory] = useState([])

  const [formData, setFormData] = useState({
    customer_id: '',
    account_id: '',
    location_id: '',
    product_id: '',
    quantity: '1'
  })

  const [status, setStatus] = useState({ type: null, message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load dropdown data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [cust, acc, prod, inv] = await Promise.all([
          api.getCustomers(),
          api.getAccounts(),
          api.getProducts(),
          api.getInventory()
        ])

        setCustomers(cust)
        setAccounts(acc)
        setProducts(prod)
        setInventory(inv)
      } catch (err) {
        console.error(err)
        setStatus({ type: 'error', message: 'Failed to load data for transaction form.' })
      }
    }

    loadData()
  }, [])

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus({ type: null, message: '' })

    // Basic validation
    if (!formData.customer_id || !formData.account_id || !formData.location_id ||
        !formData.product_id || !formData.quantity) {
      setStatus({ type: 'error', message: 'Please fill in all fields.' })
      return
    }

    const qty = Number(formData.quantity)
    if (qty <= 0 || Number.isNaN(qty)) {
      setStatus({ type: 'error', message: 'Quantity must be a positive number.' })
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        customer_id: Number(formData.customer_id),
        account_id: Number(formData.account_id),
        location_id: Number(formData.location_id),
        product_id: Number(formData.product_id),
        quantity: qty
      }

      const result = await api.createTransaction(payload)

      setStatus({
        type: 'success',
        message: `Transaction completed. Total cost: $${result.total_cost?.toFixed?.(2) ?? result.total_cost}`
      })

      // Optionally refresh inventory/account data after the transaction
      const [acc, inv] = await Promise.all([
        api.getAccounts(),
        api.getInventory()
      ])
      setAccounts(acc)
      setInventory(inv)

      // Reset quantity only (so they can do another similar purchase)
      setFormData((prev) => ({ ...prev, quantity: '1' }))
    } catch (err) {
      console.error(err)
      setStatus({
        type: 'error',
        message: err?.message || 'Transaction failed.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper for showing inventory at the selected location/product
  const selectedInventory = inventory.find(
    (row) =>
      String(row.location_id) === String(formData.location_id) &&
      String(row.product_id) === String(formData.product_id)
  )

  const selectedProduct = products.find(
    (p) => String(p.product_id) === String(formData.product_id)
  )

  const estimatedTotal =
    selectedProduct && formData.quantity
      ? Number(selectedProduct.unit_price || 0) * Number(formData.quantity || 0)
      : 0

  const filteredAccounts = formData.customer_id
    ? accounts.filter(a => String(a.customer_id) === String(formData.customer_id))
    : accounts

  return (
    <div>
      <div className="page-header">
        <h2>Customer Transactions</h2>
        <p>
          Use this form to record a purchase: choose a customer, their account, the store location,
          and the product being sold. Submitting will subtract the charge from the account balance
          and remove the quantity from inventory.
        </p>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3>Create Transaction</h3>
        </div>

        <div className="card">
          {status.message && (
            <div
              className={`alert ${
                status.type === 'success' ? 'alert-success' : 'alert-danger'
              }`}
              style={{ marginBottom: '1rem' }}
            >
              {status.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-row">
              <div className="form-group">
                <label>Customer</label>
                <select
                  value={formData.customer_id}
                  onChange={handleChange('customer_id')}
                >
                  <option value="">Select customer...</option>
                  {customers.map((c) => (
                    <option key={c.customer_id} value={c.customer_id}>
                      {c.customer_id} – {c.first_name} {c.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Account</label>
                <select
                  value={formData.account_id}
                  onChange={handleChange('account_id')}
                >
                  <option value="">Select account...</option>
                  {filteredAccounts.map((a) => (
                    <option key={a.account_id} value={a.account_id}>
                      {a.account_id} – {a.account_number} (Bal: ${a.current_balance?.toFixed?.(2) ?? a.current_balance})
                    </option>
                  ))}
                </select>
                {formData.customer_id && filteredAccounts.length === 0 && (
                  <small className="helper-text">
                    This customer has no accounts yet. Create one in the Accounts module.
                  </small>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Store Location ID</label>
                <input
                  type="number"
                  value={formData.location_id}
                  onChange={handleChange('location_id')}
                  placeholder="e.g., 1"
                />
                <small className="helper-text">
                  Must match an existing inventory location_id.
                </small>
              </div>

              <div className="form-group">
                <label>Product</label>
                <select
                  value={formData.product_id}
                  onChange={handleChange('product_id')}
                >
                  <option value="">Select product...</option>
                  {products.map((p) => (
                    <option key={p.product_id} value={p.product_id}>
                      {p.product_id} – {p.name} (SKU: {p.sku})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={handleChange('quantity')}
                />
                {selectedInventory && (
                  <small className="helper-text">
                    On hand at this location: {selectedInventory.quantity_on_hand}
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>Estimated Total</label>
                <input
                  type="text"
                  disabled
                  value={
                    selectedProduct
                      ? `$${estimatedTotal.toFixed(2)} (Unit: $${Number(
                          selectedProduct.unit_price || 0
                        ).toFixed(2)})`
                      : 'Select a product to see total'
                  }
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'Complete Transaction'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
