import { useState, useEffect } from 'react';
import '../components/CommonStyles.css';

export default function PurchaseHistory() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const customerId = localStorage.getItem('customer_id');

  useEffect(() => {
    if (customerId) {
      loadPurchaseHistory();
    } else {
      setLoading(false);
    }
  }, [customerId]);

  const loadPurchaseHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/purchase-history/${customerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPurchases(data);
      } else {
        console.error('Error loading purchase history');
      }
    } catch (err) {
      console.error('Error loading purchase history:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!customerId) {
    return (
      <div className="page-header">
        <h2>Purchase History</h2>
        <p>Please login to view your purchase history.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="page-header">Loading...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>My Purchase History</h2>
        <p>View all your electronics purchases from all warehouses</p>
      </div>

      <div className="table-container">
        {purchases.length === 0 ? (
          <div className="empty-state">
            <p>No purchase history found.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Order Date</th>
                <th>Product</th>
                <th>SKU</th>
                <th>Warehouse</th>
                <th>Channel</th>
                <th>Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase, index) => (
                <tr key={`${purchase.order_id}-${purchase.product_id}-${index}`}>
                  <td>{purchase.order_datetime ? new Date(purchase.order_datetime).toLocaleDateString() : 'N/A'}</td>
                  <td>{purchase.product_name || 'N/A'}</td>
                  <td>{purchase.sku || 'N/A'}</td>
                  <td>{purchase.warehouse_name || 'N/A'}</td>
                  <td>{purchase.channel || 'N/A'}</td>
                  <td>${purchase.unit_price ? parseFloat(purchase.unit_price).toFixed(2) : '0.00'}</td>
                  <td>
                    <span className={`badge ${purchase.order_status === 'COMPLETED' ? 'badge-success' : 'badge-secondary'}`}>
                      {purchase.order_status || 'N/A'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

