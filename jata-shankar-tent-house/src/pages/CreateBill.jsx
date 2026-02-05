import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBill, getItems, isDateBooked } from '../services/firestoreService';
import '../styles/pages.css';

export default function CreateBill() {
  const [customerName, setCustomerName] = useState('');
  const [date, setDate] = useState('');
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [dateError, setDateError] = useState('');
  const navigate = useNavigate();

  // Fetch items on mount
  useEffect(() => {
    fetchItems();
  }, []);

  // Check if date is already booked
  useEffect(() => {
    if (date) {
      checkDateAvailability();
    }
  }, [date]);

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

  const checkDateAvailability = async () => {
    try {
      const booked = await isDateBooked(date);
      if (booked) {
        setDateError('This date is already booked');
      } else {
        setDateError('');
      }
    } catch (err) {
      console.error('Error checking date:', err);
    }
  };

  // Add item to bill
  const addItem = (item) => {
    const existing = selectedItems.find(si => si.id === item.id);
    if (existing) {
      updateItemQuantity(item.id, existing.quantity + 1);
    } else {
      setSelectedItems([
        ...selectedItems,
        { ...item, quantity: 1 },
      ]);
    }
  };

  // Update item quantity
  const updateItemQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeItem(itemId);
    } else {
      setSelectedItems(
        selectedItems.map(si =>
          si.id === itemId ? { ...si, quantity } : si
        )
      );
    }
  };

  // Remove item from bill
  const removeItem = (itemId) => {
    setSelectedItems(selectedItems.filter(si => si.id !== itemId));
  };

  // Calculate total
  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => sum + (item.rate * item.quantity), 0);
  };

  // Submit bill
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!customerName.trim()) {
      setError('Please enter customer name');
      return;
    }
    if (!date) {
      setError('Please select a date');
      return;
    }
    if (dateError) {
      setError('Selected date is not available');
      return;
    }
    if (selectedItems.length === 0) {
      setError('Please add at least one item');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const billData = {
        customerName: customerName.trim(),
        date,
        items: selectedItems.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          rate: item.rate,
        })),
        total: calculateTotal(),
      };

      const billId = await createBill(billData);
      
      // Show success and redirect
      alert('Bill created successfully! Waiting for owner approval.');
      navigate('/');
    } catch (err) {
      setError('Failed to create bill: ' + err.message);
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const total = calculateTotal();

  return (
    <div className="create-bill-container">
      <header className="page-header">
        <h1>Create New Bill</h1>
        <button onClick={() => navigate('/')} className="btn-back">
          ← Back
        </button>
      </header>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="bill-form">
        {/* Customer Details */}
        <section className="form-section">
          <h2>Customer Details</h2>
          
          <div className="form-group">
            <label htmlFor="customerName">Customer Name *</label>
            <input
              id="customerName"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="date">Event Date *</label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />
            {dateError && <p className="warning-text">{dateError}</p>}
          </div>
        </section>

        {/* Items Selection */}
        <section className="form-section">
          <h2>Select Items</h2>
          
          {loading ? (
            <p>Loading items...</p>
          ) : items.length === 0 ? (
            <p>No items available</p>
          ) : (
            <div className="items-grid">
              {items.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => addItem(item)}
                  className="item-button"
                >
                  <div className="item-name">{item.name}</div>
                  <div className="item-rate">₹{item.rate}</div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Selected Items */}
        {selectedItems.length > 0 && (
          <section className="form-section">
            <h2>Selected Items</h2>
            <div className="selected-items">
              {selectedItems.map(item => (
                <div key={item.id} className="selected-item">
                  <div className="item-details">
                    <h4>{item.name}</h4>
                    <p>Rate: ₹{item.rate}</p>
                  </div>
                  <div className="quantity-control">
                    <button
                      type="button"
                      onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                      className="qty-btn"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                      min="1"
                      className="qty-input"
                    />
                    <button
                      type="button"
                      onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                      className="qty-btn"
                    >
                      +
                    </button>
                  </div>
                  <div className="item-total">
                    ₹{item.rate * item.quantity}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="btn-remove"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Total */}
        {selectedItems.length > 0 && (
          <div className="bill-total">
            <h3>Total Amount: ₹{total}</h3>
          </div>
        )}

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={submitting || selectedItems.length === 0}
          className="btn-primary btn-submit"
        >
          {submitting ? 'Creating Bill...' : 'Submit Bill for Approval'}
        </button>
      </form>
    </div>
  );
}
