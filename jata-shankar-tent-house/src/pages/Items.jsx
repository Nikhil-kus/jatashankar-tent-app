import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getItems, updateItemRate } from '../services/firestoreService';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import '../styles/pages.css';

export default function Items() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingRate, setEditingRate] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemRate, setNewItemRate] = useState('');
  const [addingItem, setAddingItem] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const itemsData = await getItems();
      setItems(itemsData);
    } catch (err) {
      setError('Failed to load items');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditRate = (item) => {
    setEditingId(item.id);
    setEditingRate(item.rate.toString());
  };

  const handleSaveRate = async (itemId) => {
    if (!editingRate || isNaN(editingRate)) {
      setError('Please enter a valid rate');
      return;
    }

    try {
      setUpdating(true);
      const newRate = parseFloat(editingRate);
      await updateItemRate(itemId, newRate);
      
      // Update local state
      setItems(items.map(item =>
        item.id === itemId ? { ...item, rate: newRate } : item
      ));
      
      setEditingId(null);
      setEditingRate('');
      alert('Rate updated successfully');
    } catch (err) {
      setError('Failed to update rate: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingRate('');
  };

  // Add new item
  const handleAddItem = async (e) => {
    e.preventDefault();
    
    if (!newItemName.trim()) {
      setError('Please enter item name');
      return;
    }
    
    if (!newItemRate || isNaN(newItemRate) || parseFloat(newItemRate) <= 0) {
      setError('Please enter a valid rate');
      return;
    }

    try {
      setAddingItem(true);
      setError('');
      
      // Add to Firestore
      const itemsRef = collection(db, 'items');
      const docRef = await addDoc(itemsRef, {
        name: newItemName.trim(),
        rate: parseFloat(newItemRate)
      });

      // Add to local state
      setItems([...items, {
        id: docRef.id,
        name: newItemName.trim(),
        rate: parseFloat(newItemRate)
      }]);

      // Reset form
      setNewItemName('');
      setNewItemRate('');
      setShowAddForm(false);
      alert('Item added successfully!');
    } catch (err) {
      setError('Failed to add item: ' + err.message);
      console.error(err);
    } finally {
      setAddingItem(false);
    }
  };

  return (
    <div className="items-container">
      <header className="page-header">
        <h1>Manage Items & Prices</h1>
        <button onClick={() => navigate('/dashboard')} className="btn-back">
          ← Dashboard
        </button>
      </header>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading items...</div>
      ) : (
        <div className="items-management">
          {/* Add New Item Form */}
          {!showAddForm ? (
            <button 
              onClick={() => setShowAddForm(true)}
              className="btn-primary"
              style={{ marginBottom: '20px', width: '100%', maxWidth: '300px' }}
            >
              + Add New Item
            </button>
          ) : (
            <div style={{
              background: '#f9f9f9',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '2px solid #2196f3'
            }}>
              <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Add New Item</h3>
              <form onSubmit={handleAddItem}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                    Item Name *
                  </label>
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="e.g., अरी शीशम 15 x 15"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                    Rate (₹) *
                  </label>
                  <input
                    type="number"
                    value={newItemRate}
                    onChange={(e) => setNewItemRate(e.target.value)}
                    placeholder="e.g., 500"
                    step="0.01"
                    min="0"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="submit"
                    disabled={addingItem}
                    className="btn-primary"
                    style={{ flex: 1 }}
                  >
                    {addingItem ? 'Adding...' : 'Add Item'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewItemName('');
                      setNewItemRate('');
                    }}
                    className="btn-cancel"
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Items List */}
          {items.length === 0 ? (
            <div className="empty-state">
              <p>No items found. Add your first item above!</p>
            </div>
          ) : (
            <>
              <div className="items-table">
                <div className="table-header">
                  <div className="col-name">Item Name</div>
                  <div className="col-rate">Current Rate (₹)</div>
                  <div className="col-action">Action</div>
                </div>

                {items.map(item => (
                  <div key={item.id} className="table-row">
                    <div className="col-name">{item.name}</div>
                    <div className="col-rate">
                      {editingId === item.id ? (
                        <input
                          type="number"
                          value={editingRate}
                          onChange={(e) => setEditingRate(e.target.value)}
                          className="rate-input"
                          step="0.01"
                          min="0"
                        />
                      ) : (
                        <span className="rate-value">₹{item.rate}</span>
                      )}
                    </div>
                    <div className="col-action">
                      {editingId === item.id ? (
                        <div className="action-buttons-inline">
                          <button
                            onClick={() => handleSaveRate(item.id)}
                            disabled={updating}
                            className="btn-save"
                          >
                            {updating ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={handleCancel}
                            disabled={updating}
                            className="btn-cancel"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditRate(item)}
                          className="btn-edit"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="items-info">
                <p>Total Items: {items.length}</p>
                <p className="info-text">
                  Add new items or edit rates. Changes will apply to all new bills created after the update.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
