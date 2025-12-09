import { useState, useEffect } from 'react'
import api from '../services/api'
import '../components/CommonStyles.css'

export default function Manufacturers() {
  const [manufacturers, setManufacturers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingManufacturer, setEditingManufacturer] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    country: ''
  })

  useEffect(() => {
    loadManufacturers()
  }, [])

  const loadManufacturers = () => {
    api.getManufacturers().then(setManufacturers)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingManufacturer) {
      api.updateManufacturer(editingManufacturer.manufacturer_id, formData)
        .then(() => {
          loadManufacturers()
          resetForm()
        })
    } else {
      api.createManufacturer(formData)
        .then(() => {
          loadManufacturers()
          resetForm()
        })
    }
  }

  const handleEdit = (manufacturer) => {
    setEditingManufacturer(manufacturer)
    setFormData({
      name: manufacturer.name || '',
      country: manufacturer.country || ''
    })
    setShowForm(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this manufacturer?')) {
      api.deleteManufacturer(id).then(loadManufacturers)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      country: ''
    })
    setEditingManufacturer(null)
    setShowForm(false)
  }

  return (
    <div>
      <div className="page-header">
        <h2>Manufacturers</h2>
        <p>Manage electronics manufacturers such as Sony, Apple, HP, Gateway, and others. Track manufacturer information for product sourcing and reorder management.</p>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3>Manufacturer List</h3>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Add Manufacturer
          </button>
        </div>
        {manufacturers.length === 0 ? (
          <div className="empty-state">
            <p>No manufacturers found. Add your first manufacturer!</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Country</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {manufacturers.map(manufacturer => (
                <tr key={manufacturer.manufacturer_id}>
                  <td>{manufacturer.manufacturer_id}</td>
                  <td>{manufacturer.name}</td>
                  <td>{manufacturer.country || 'N/A'}</td>
                  <td>
                    <button className="btn btn-secondary" onClick={() => handleEdit(manufacturer)} style={{ marginRight: '0.5rem' }}>
                      Edit
                    </button>
                    <button className="btn btn-danger" onClick={() => handleDelete(manufacturer.manufacturer_id)}>
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
              <h3>{editingManufacturer ? 'Edit Manufacturer' : 'Add Manufacturer'}</h3>
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
                <label>Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingManufacturer ? 'Update' : 'Create'}
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

