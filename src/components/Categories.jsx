import { useState, useEffect } from 'react'
import api from '../services/api'
import '../components/CommonStyles.css'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [categoryProducts, setCategoryProducts] = useState({})
  const [expandedCategories, setExpandedCategories] = useState(new Set())
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    category_type: '',
    parent_category_id: ''
  })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    const data = await api.getCategories()
    setCategories(data)
    // Load products for each category
    const productsMap = {}
    for (const cat of data) {
      try {
        const products = await api.request(`/categories/${cat.category_id}/products`)
        productsMap[cat.category_id] = products || []
      } catch (err) {
        productsMap[cat.category_id] = []
      }
    }
    setCategoryProducts(productsMap)
  }

  const toggleExpand = (categoryId) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = {
      ...formData,
      parent_category_id: formData.parent_category_id ? parseInt(formData.parent_category_id) : null
    }
    if (editingCategory) {
      api.updateCategory(editingCategory.category_id, data)
        .then(() => {
          loadCategories()
          resetForm()
        })
    } else {
      api.createCategory(data)
        .then(() => {
          loadCategories()
          resetForm()
        })
    }
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name || '',
      category_type: category.category_type || '',
      parent_category_id: category.parent_category_id || ''
    })
    setShowForm(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      api.deleteCategory(id).then(loadCategories)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      category_type: '',
      parent_category_id: ''
    })
    setEditingCategory(null)
    setShowForm(false)
  }

  return (
    <div>
      <div className="page-header">
        <h2>Categories</h2>
        <p>Organize products into categories by type (cameras, phones, computers, etc.), manufacturer, or other groupings. Click on a category to see its products.</p>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3>Category List</h3>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Add Category
          </button>
        </div>
        {categories.length === 0 ? (
          <div className="empty-state">
            <p>No categories found. Add your first category!</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: '30px' }}></th>
                <th>ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Parent Category</th>
                <th>Products</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(category => {
                const parent = categories.find(c => c.category_id === category.parent_category_id)
                const isExpanded = expandedCategories.has(category.category_id)
                const products = categoryProducts[category.category_id] || []
                
                return (
                  <>
                    <tr key={category.category_id} style={{ cursor: 'pointer' }} onClick={() => toggleExpand(category.category_id)}>
                      <td>
                        <span style={{ 
                          display: 'inline-block',
                          width: '20px',
                          textAlign: 'center',
                          fontWeight: 'bold'
                        }}>
                          {products.length > 0 ? (isExpanded ? '▼' : '▶') : ''}
                        </span>
                      </td>
                      <td>{category.category_id}</td>
                      <td><strong>{category.name}</strong></td>
                      <td>{category.category_type || 'N/A'}</td>
                      <td>{parent ? parent.name : 'None'}</td>
                      <td>
                        <span className="badge badge-info">
                          {products.length} product{products.length !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button className="btn btn-secondary" onClick={() => handleEdit(category)} style={{ marginRight: '0.5rem' }}>
                          Edit
                        </button>
                        <button className="btn btn-danger" onClick={() => handleDelete(category.category_id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                    {isExpanded && products.length > 0 && (
                      <tr>
                        <td colSpan="7" style={{ padding: '0', backgroundColor: '#f8f9fa' }}>
                          <div style={{ padding: '15px 40px', borderTop: '1px solid #dee2e6' }}>
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#6c757d' }}>
                              Products in {category.name}:
                            </h4>
                            <table style={{ width: '100%', fontSize: '13px' }}>
                              <thead>
                                <tr style={{ backgroundColor: '#e9ecef' }}>
                                  <th style={{ padding: '8px', textAlign: 'left' }}>Product ID</th>
                                  <th style={{ padding: '8px', textAlign: 'left' }}>SKU</th>
                                  <th style={{ padding: '8px', textAlign: 'left' }}>Name</th>
                                  <th style={{ padding: '8px', textAlign: 'right' }}>Price</th>
                                  <th style={{ padding: '8px', textAlign: 'left' }}>Manufacturer</th>
                                </tr>
                              </thead>
                              <tbody>
                                {products.map(product => (
                                  <tr key={product.product_id} style={{ borderBottom: '1px solid #dee2e6' }}>
                                    <td style={{ padding: '8px' }}>{product.product_id}</td>
                                    <td style={{ padding: '8px' }}>{product.sku || 'N/A'}</td>
                                    <td style={{ padding: '8px' }}>{product.name}</td>
                                    <td style={{ padding: '8px', textAlign: 'right' }}>${product.unit_price?.toFixed(2)}</td>
                                    <td style={{ padding: '8px' }}>{product.manufacturer_name || 'N/A'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                    {isExpanded && products.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ padding: '15px 40px', backgroundColor: '#f8f9fa', borderTop: '1px solid #dee2e6' }}>
                          <p style={{ margin: '0', color: '#6c757d', fontStyle: 'italic' }}>
                            No products found in this category.
                          </p>
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
              <h3>{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="form-container">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Category Type</label>
                <input
                  type="text"
                  value={formData.category_type}
                  onChange={(e) => setFormData({ ...formData, category_type: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Parent Category</label>
                <select
                  value={formData.parent_category_id}
                  onChange={(e) => setFormData({ ...formData, parent_category_id: e.target.value })}
                >
                  <option value="">None</option>
                  {categories
                    .filter(c => !editingCategory || c.category_id !== editingCategory.category_id)
                    .map(c => (
                      <option key={c.category_id} value={c.category_id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingCategory ? 'Update' : 'Create'}
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

