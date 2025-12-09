import { useState, useEffect } from 'react'
import api from '../services/api'
import '../components/CommonStyles.css'

export default function Categories() {
  const [categories, setCategories] = useState([])
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

  const loadCategories = () => {
    api.getCategories().then(setCategories)
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
        <p>Organize products into categories by type (cameras, phones, computers, etc.), manufacturer, or other groupings. Categories can be hierarchical and overlapping to support flexible product organization for marketing and sales analysis.</p>
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
                <th>ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Parent Category</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(category => {
                const parent = categories.find(c => c.category_id === category.parent_category_id)
                return (
                  <tr key={category.category_id}>
                    <td>{category.category_id}</td>
                    <td>{category.name}</td>
                    <td>{category.category_type || 'N/A'}</td>
                    <td>{parent ? parent.name : 'None'}</td>
                    <td>
                      <button className="btn btn-secondary" onClick={() => handleEdit(category)} style={{ marginRight: '0.5rem' }}>
                        Edit
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDelete(category.category_id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
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

