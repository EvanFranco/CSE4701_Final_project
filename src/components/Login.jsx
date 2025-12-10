import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../components/CommonStyles.css';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userType: 'customer' // 'customer' or 'employee'
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const endpoint = formData.userType === 'customer' 
        ? 'http://localhost:3001/api/auth/login'
        : 'http://localhost:3001/api/auth/employee/login';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Store token and user info
        localStorage.setItem('token', data.token);
        if (formData.userType === 'customer') {
          localStorage.setItem('customer_id', data.customer.customer_id);
          localStorage.setItem('customer_email', data.customer.email);
          localStorage.setItem('user_type', 'customer');
          navigate('/customer/dashboard');
        } else {
          localStorage.setItem('employee_id', data.employee.employee_id);
          localStorage.setItem('warehouse_id', data.employee.warehouse_id);
          localStorage.setItem('employee_role', data.employee.role);
          localStorage.setItem('user_type', 'employee');
          navigate('/employee/dashboard');
        }
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login</h2>
        {error && <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>User Type</label>
            <select
              value={formData.userType}
              onChange={(e) => setFormData({ ...formData, userType: e.target.value })}
            >
              <option value="customer">Customer</option>
              <option value="employee">Employee</option>
            </select>
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
            <label>Password *</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">Login</button>
            {formData.userType === 'customer' && (
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/register')}>
                Don't have an account? Register
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

