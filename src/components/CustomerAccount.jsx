import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../components/CommonStyles.css';

export default function CustomerAccount() {
  const navigate = useNavigate();
  const customerId = localStorage.getItem('customer_id');
  const [customer, setCustomer] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    billing_address: '',
    shipping_address: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (customerId) {
      loadCustomer();
    } else {
      navigate('/login');
    }
  }, [customerId, navigate]);

  const loadCustomer = async () => {
    try {
      const customerData = await api.getCustomer(customerId);
      setCustomer(customerData);
      setFormData({
        first_name: customerData.first_name || '',
        last_name: customerData.last_name || '',
        email: customerData.email || '',
        phone: customerData.phone || '',
        billing_address: customerData.billing_address || '',
        shipping_address: customerData.shipping_address || ''
      });
    } catch (err) {
      setError('Error loading customer information');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await api.updateCustomer(customerId, formData);
      alert('Account updated successfully!');
      loadCustomer();
    } catch (err) {
      setError(err.message || 'Error updating account');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    if (!window.confirm('This will permanently delete your account and all associated data. Are you absolutely sure?')) {
      return;
    }

    try {
      await api.deleteCustomer(customerId);
      alert('Account deleted successfully');
      // Clear local storage and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('customer_id');
      localStorage.removeItem('customer_email');
      localStorage.removeItem('user_type');
      navigate('/');
    } catch (err) {
      setError(err.message || 'Error deleting account. You may have existing orders or accounts.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('customer_id');
    localStorage.removeItem('customer_email');
    localStorage.removeItem('user_type');
    navigate('/login');
  };

  if (loading) {
    return <div className="page-header">Loading...</div>;
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>My Account</h2>
          <p>Manage your account information</p>
        </div>
        <button className="btn btn-secondary" onClick={handleLogout}>Logout</button>
      </div>

      <div className="form-container">
        {error && <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Customer ID</label>
            <input
              type="text"
              value={customerId}
              disabled
              style={{ background: '#f5f5f5' }}
            />
            <small style={{ color: '#666' }}>Your unique customer ID (cannot be changed)</small>
          </div>
          
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          
          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            />
          </div>
          
          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
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
          
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">Update Account</button>
            <button type="button" className="btn btn-danger" onClick={handleDelete}>
              Delete Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

