import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../services/authService';
import { getAllBills, getAllBookings, createBill, createBooking, getItems } from '../services/firestoreService';
import '../styles/pages.css';

export default function Dashboard() {
  const [bills, setBills] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showQuickBill, setShowQuickBill] = useState(false);
  const [showDetailedBill, setShowDetailedBill] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null); // Add selected bill state
  const [quickBillData, setQuickBillData] = useState({
    customerName: '',
    date: '',
    totalAmount: '',
    receivedAmount: '',
    serviceTypes: [] // Add service types
  });
  const [detailedBillData, setDetailedBillData] = useState({
    customerName: '',
    date: '',
    items: []
  });
  const [availableItems, setAvailableItems] = useState([]);
  const [creatingBill, setCreatingBill] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [billsData, bookingsData, itemsData] = await Promise.all([
        getAllBills(),
        getAllBookings(),
        getItems(),
      ]);
      setBills(billsData);
      setBookings(bookingsData);
      setAvailableItems(itemsData);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (err) {
      setError('Logout failed');
    }
  };

  // Handle quick bill creation
  const handleCreateQuickBill = async (e) => {
    e.preventDefault();

    if (!quickBillData.customerName.trim()) {
      setError('Please enter customer name');
      return;
    }
    if (!quickBillData.date) {
      setError('Please select a date');
      return;
    }
    if (!quickBillData.totalAmount || isNaN(quickBillData.totalAmount) || parseFloat(quickBillData.totalAmount) <= 0) {
      setError('Please enter a valid total amount');
      return;
    }
    if (quickBillData.serviceTypes.length === 0) {
      setError('Please select at least one service type');
      return;
    }

    try {
      setCreatingBill(true);
      setError('');

      const billData = {
        customerName: quickBillData.customerName.trim(),
        date: quickBillData.date,
        items: [],
        total: parseFloat(quickBillData.totalAmount),
        isQuickBill: true,
        status: 'approved',
        createdByOwner: true,
        serviceTypes: quickBillData.serviceTypes, // Add service types
      };

      if (quickBillData.receivedAmount && !isNaN(quickBillData.receivedAmount)) {
        billData.receivedAmount = parseFloat(quickBillData.receivedAmount);
      }

      const billId = await createBill(billData);
      await createBooking({
        date: quickBillData.date,
        billId: billId,
        customerName: quickBillData.customerName.trim(),
      });

      setQuickBillData({
        customerName: '',
        date: '',
        totalAmount: '',
        receivedAmount: '',
        serviceTypes: []
      });
      setShowQuickBill(false);

      await fetchData();
      alert('Quick bill created and booking confirmed!');
    } catch (err) {
      setError('Failed to create bill: ' + err.message);
      console.error(err);
    } finally {
      setCreatingBill(false);
    }
  };

  // Handle detailed bill creation
  const handleCreateDetailedBill = async (e) => {
    e.preventDefault();

    if (!detailedBillData.customerName.trim()) {
      setError('Please enter customer name');
      return;
    }
    if (!detailedBillData.date) {
      setError('Please select a date');
      return;
    }
    if (detailedBillData.items.length === 0) {
      setError('Please add at least one item');
      return;
    }

    try {
      setCreatingBill(true);
      setError('');

      const total = detailedBillData.items.reduce((sum, item) => sum + (item.rate * item.quantity), 0);

      const billData = {
        customerName: detailedBillData.customerName.trim(),
        date: detailedBillData.date,
        items: detailedBillData.items.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          rate: item.rate,
        })),
        total: total,
        status: 'approved',
        createdByOwner: true,
        isQuickBill: false,
        serviceTypes: ['Tent'], // All detailed bills are automatically 'Tent'
      };

      const billId = await createBill(billData);
      await createBooking({
        date: detailedBillData.date,
        billId: billId,
        customerName: detailedBillData.customerName.trim(),
      });

      setDetailedBillData({
        customerName: '',
        date: '',
        items: []
      });
      setShowDetailedBill(false);

      await fetchData();
      alert('Detailed bill created and booking confirmed!');
    } catch (err) {
      setError('Failed to create bill: ' + err.message);
      console.error(err);
    } finally {
      setCreatingBill(false);
    }
  };

  // Add item to detailed bill
  const addItemToDetailedBill = (item) => {
    const existing = detailedBillData.items.find(i => i.id === item.id);
    if (existing) {
      setDetailedBillData({
        ...detailedBillData,
        items: detailedBillData.items.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      });
    } else {
      setDetailedBillData({
        ...detailedBillData,
        items: [...detailedBillData.items, { ...item, quantity: 1 }]
      });
    }
  };

  // Update item quantity
  const updateDetailedBillItemQty = (itemId, quantity) => {
    if (quantity <= 0) {
      setDetailedBillData({
        ...detailedBillData,
        items: detailedBillData.items.filter(i => i.id !== itemId)
      });
    } else {
      setDetailedBillData({
        ...detailedBillData,
        items: detailedBillData.items.map(i =>
          i.id === itemId ? { ...i, quantity } : i
        )
      });
    }
  };

  // Remove item from detailed bill
  const removeDetailedBillItem = (itemId) => {
    setDetailedBillData({
      ...detailedBillData,
      items: detailedBillData.items.filter(i => i.id !== itemId)
    });
  };

  const calculateDetailedBillTotal = () => {
    return detailedBillData.items.reduce((sum, item) => sum + (item.rate * item.quantity), 0);
  };

  const pendingBills = bills.filter(b => b.status === 'pending');
  const approvedBills = bills.filter(b => b.status === 'approved');
  const todayBookings = bookings.filter(b => b.date === new Date().toISOString().split('T')[0]);

  // Sort bills same as Bills Management: past (newest first) + nearest + future (nearest first)
  const sortedBillsForDashboard = () => {
    const today = new Date().toISOString().split('T')[0];
    
    const past = [];
    const upcoming = [];
    let nearest = null;

    bills.forEach(bill => {
      // Only consider approved bills for nearest event
      if (bill.status === 'approved') {
        if (bill.date < today) {
          past.push(bill);
        } else if (bill.date === today) {
          nearest = bill;
        } else {
          upcoming.push(bill);
        }
      }
    });

    // Sort past bills by date (newest first)
    past.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Sort upcoming bills by date (nearest first)
    upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Add pending bills at the beginning
    const pending = bills.filter(b => b.status === 'pending');
    
    // Combine: pending + past + nearest + upcoming
    const result = [...pending, ...past];
    if (nearest) result.push(nearest);
    result.push(...upcoming);

    return result;
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>Owner Dashboard</h1>
          <p>Jata Shankar Tent House</p>
        </div>
        <button onClick={handleLogout} className="btn-logout">
          Logout
        </button>
      </header>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="dashboard-content">
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Bills</h3>
              <p className="stat-number">{bills.length}</p>
            </div>
            <div className="stat-card">
              <h3>Pending Approval</h3>
              <p className="stat-number pending">{pendingBills.length}</p>
            </div>
            <div className="stat-card">
              <h3>Approved Bookings</h3>
              <p className="stat-number approved">{approvedBills.length}</p>
            </div>
            <div className="stat-card">
              <h3>Today's Bookings</h3>
              <p className="stat-number">{todayBookings.length}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button 
              onClick={() => setShowDetailedBill(!showDetailedBill)} 
              className="btn-primary"
              style={{ background: '#10B981', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)', padding: '8px 14px', fontSize: '13px' }}
            >
              {showDetailedBill ? 'Cancel Detailed Bill' : '+ Detailed Bill'}
            </button>
            <button 
              onClick={() => setShowQuickBill(!showQuickBill)} 
              className="btn-primary"
              style={{ background: '#F59E0B', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)', padding: '8px 14px', fontSize: '13px' }}
            >
              {showQuickBill ? 'Cancel Quick Bill' : '+ Quick Bill'}
            </button>
            <button 
              onClick={() => navigate('/bills')} 
              className="btn-primary"
              style={{ background: '#3B82F6', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)', padding: '8px 14px', fontSize: '13px' }}
            >
              View All Bills
            </button>
            <button 
              onClick={() => navigate('/calendar')} 
              className="btn-primary"
              style={{ background: '#8B5CF6', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)', padding: '8px 14px', fontSize: '13px' }}
            >
              View Calendar
            </button>
            <button 
              onClick={() => navigate('/items')} 
              className="btn-primary"
              style={{ background: '#EC4899', boxShadow: '0 4px 12px rgba(236, 72, 153, 0.3)', padding: '8px 14px', fontSize: '13px' }}
            >
              Manage Items & Prices
            </button>
          </div>

          {/* Detailed Bill Form */}
          {showDetailedBill && (
            <div style={{
              background: '#e8f5e9',
              padding: '20px',
              borderRadius: '8px',
              border: '2px solid #4caf50',
              marginBottom: '20px'
            }}>
              <h2 style={{ marginTop: '0', marginBottom: '16px', color: '#2e7d32' }}>
                Detailed Bill Creation
              </h2>
              <form onSubmit={handleCreateDetailedBill}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      value={detailedBillData.customerName}
                      onChange={(e) => setDetailedBillData({ ...detailedBillData, customerName: e.target.value })}
                      placeholder="Enter customer name"
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

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                      Event Date *
                    </label>
                    <input
                      type="date"
                      value={detailedBillData.date}
                      onChange={(e) => setDetailedBillData({ ...detailedBillData, date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
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
                </div>

                {/* Items Selection */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Select Items *
                  </label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                    gap: '8px'
                  }}>
                    {availableItems.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => addItemToDetailedBill(item)}
                        style={{
                          padding: '10px',
                          background: '#f0f0f0',
                          border: '2px solid #ddd',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          textAlign: 'center'
                        }}
                      >
                        <div style={{ fontWeight: '500', fontSize: '12px', marginBottom: '4px' }}>
                          {item.name}
                        </div>
                        <div style={{ color: '#4caf50', fontWeight: 'bold', fontSize: '13px' }}>
                          ₹{item.rate}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected Items */}
                {detailedBillData.items.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ marginBottom: '12px', fontSize: '14px' }}>Selected Items</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {detailedBillData.items.map(item => (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px',
                            background: '#f9f9f9',
                            borderRadius: '6px',
                            borderLeft: '4px solid #4caf50'
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: '0 0 4px 0', fontSize: '13px' }}>{item.name}</h4>
                            <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>
                              ₹{item.rate} × {item.quantity} = ₹{item.rate * item.quantity}
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={() => updateDetailedBillItemQty(item.id, item.quantity - 1)}
                              style={{
                                width: '28px',
                                height: '28px',
                                padding: '0',
                                background: '#e0e0e0',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '16px'
                              }}
                            >
                              −
                            </button>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateDetailedBillItemQty(item.id, parseInt(e.target.value) || 1)}
                              min="1"
                              style={{
                                width: '50px',
                                padding: '4px',
                                textAlign: 'center',
                                border: '1px solid #ddd',
                                borderRadius: '4px'
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => updateDetailedBillItemQty(item.id, item.quantity + 1)}
                              style={{
                                width: '28px',
                                height: '28px',
                                padding: '0',
                                background: '#e0e0e0',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '16px'
                              }}
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => removeDetailedBillItem(item.id)}
                              style={{
                                padding: '6px 12px',
                                background: '#ff9800',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Total */}
                {detailedBillData.items.length > 0 && (
                  <div style={{
                    background: 'white',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '16px',
                    textAlign: 'right'
                  }}>
                    <h3 style={{ margin: '0', fontSize: '16px', fontWeight: 'bold', color: '#4caf50' }}>
                      Total: ₹{calculateDetailedBillTotal()}
                    </h3>
                  </div>
                )}

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="submit"
                    disabled={creatingBill || detailedBillData.items.length === 0}
                    className="btn-primary"
                    style={{ flex: 1, background: '#4caf50' }}
                  >
                    {creatingBill ? 'Creating...' : 'Create Detailed Bill'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDetailedBill(false);
                      setDetailedBillData({ customerName: '', date: '', items: [] });
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

          {/* Quick Bill Form */}
          {showQuickBill && (
            <div style={{
              background: '#FEF3C7',
              padding: '20px',
              borderRadius: '8px',
              border: '2px solid #F59E0B',
              marginBottom: '20px'
            }}>
              <h2 style={{ marginTop: '0', marginBottom: '16px', color: '#D97706' }}>
                Quick Bill Creation
              </h2>
              <form onSubmit={handleCreateQuickBill}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      value={quickBillData.customerName}
                      onChange={(e) => setQuickBillData({ ...quickBillData, customerName: e.target.value })}
                      placeholder="Enter customer name"
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

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                      Event Date *
                    </label>
                    <input
                      type="date"
                      value={quickBillData.date}
                      onChange={(e) => setQuickBillData({ ...quickBillData, date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
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

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                      Total Amount (₹) *
                    </label>
                    <input
                      type="number"
                      value={quickBillData.totalAmount}
                      onChange={(e) => setQuickBillData({ ...quickBillData, totalAmount: e.target.value })}
                      placeholder="Enter total amount"
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

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                      Received Amount (₹) (Optional)
                    </label>
                    <input
                      type="number"
                      value={quickBillData.receivedAmount}
                      onChange={(e) => setQuickBillData({ ...quickBillData, receivedAmount: e.target.value })}
                      placeholder="Enter received amount"
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
                </div>

                {/* Service Types Selection */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Select Service Types * (Choose one or more)
                  </label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                    gap: '8px'
                  }}>
                    {['Tent', 'Palace', 'DJ', 'Roadlight'].map(service => (
                      <label
                        key={service}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '10px',
                          background: quickBillData.serviceTypes.includes(service) ? '#fff9c4' : '#f5f5f5',
                          border: quickBillData.serviceTypes.includes(service) ? '2px solid #fbc02d' : '2px solid #ddd',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={quickBillData.serviceTypes.includes(service)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setQuickBillData({
                                ...quickBillData,
                                serviceTypes: [...quickBillData.serviceTypes, service]
                              });
                            } else {
                              setQuickBillData({
                                ...quickBillData,
                                serviceTypes: quickBillData.serviceTypes.filter(s => s !== service)
                              });
                            }
                          }}
                          style={{ marginRight: '6px', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>{service}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {quickBillData.totalAmount && (
                  <div style={{
                    background: 'white',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#666' }}>Total Amount</p>
                      <p style={{ margin: '0', fontSize: '18px', fontWeight: 'bold', color: '#2196f3' }}>
                        ₹{quickBillData.totalAmount}
                      </p>
                    </div>
                    {quickBillData.receivedAmount && (
                      <>
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#666' }}>Received</p>
                          <p style={{ margin: '0', fontSize: '16px', fontWeight: 'bold', color: '#4caf50' }}>
                            ₹{quickBillData.receivedAmount}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#666' }}>Balance</p>
                          <p style={{ 
                            margin: '0', 
                            fontSize: '16px', 
                            fontWeight: 'bold', 
                            color: parseFloat(quickBillData.totalAmount) - parseFloat(quickBillData.receivedAmount) > 0 ? '#f44336' : '#4caf50'
                          }}>
                            ₹{parseFloat(quickBillData.totalAmount) - parseFloat(quickBillData.receivedAmount || 0)}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="submit"
                    disabled={creatingBill}
                    className="btn-primary"
                    style={{ flex: 1, background: '#F59E0B' }}
                  >
                    {creatingBill ? 'Creating...' : 'Create Quick Bill'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuickBill(false);
                      setQuickBillData({ customerName: '', date: '', totalAmount: '', receivedAmount: '' });
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

          {/* All Bills - Show list or selected bill details */}
          {bills.length > 0 && !selectedBill && (
            <div className="section">
              <h2>All Bills ({bills.length})</h2>
              <div className="bills-list">
                {sortedBillsForDashboard().slice(0, 5).map(bill => {
                  // Format date to show day and month clearly
                  const dateObj = new Date(bill.date + 'T00:00:00');
                  const day = dateObj.getDate();
                  const month = dateObj.toLocaleString('en-US', { month: 'short' });
                  
                  // Check if this is today's or nearest upcoming event (only for approved bills)
                  const today = new Date().toISOString().split('T')[0];
                  const isNearest = bill.status === 'approved' && (bill.date === today || 
                    (bill.date > today && !sortedBillsForDashboard().some(b => b.status === 'approved' && b.date > today && b.date < bill.date)));
                  
                  return (
                    <div
                      key={bill.id}
                      onClick={() => setSelectedBill(bill)}
                      className="bill-list-item"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        background: isNearest ? '#fffde7' : bill.status === 'pending' ? '#FFEBEE' : '#f9f9f9',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        borderLeft: isNearest ? '4px solid #fbc02d' : bill.status === 'pending' ? '4px solid #f44336' : '4px solid #ddd',
                        marginBottom: '8px',
                        boxShadow: isNearest ? '0 2px 8px rgba(251, 192, 45, 0.3)' : 'none'
                      }}
                    >
                      {/* Left Side - Name and Date */}
                      <div style={{ flex: 1 }}>
                        <div className="bill-list-header">
                          <h4 style={{ margin: '0 0 8px 0', fontSize: '15px' }}>
                            {bill.customerName}
                            {isNearest && <span style={{ marginLeft: '8px', fontSize: '12px', color: '#fbc02d', fontWeight: 'bold' }}>● NEAREST</span>}
                          </h4>
                          <span
                            className="status-badge"
                            style={{ 
                              backgroundColor: bill.status === 'pending' ? '#f44336' : bill.status === 'approved' ? '#4caf50' : '#ff9800',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              color: 'white',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              display: 'inline-block'
                            }}
                          >
                            {bill.status}
                          </span>
                        </div>
                        {/* Date - Clear Format */}
                        <div style={{
                          marginTop: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <div style={{
                            background: isNearest ? '#fbc02d' : '#2196f3',
                            color: isNearest ? '#333' : 'white',
                            padding: '6px 10px',
                            borderRadius: '4px',
                            textAlign: 'center',
                            minWidth: '50px'
                          }}>
                            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                              {day}
                            </div>
                            <div style={{ fontSize: '11px' }}>
                              {month}
                            </div>
                          </div>
                          <span style={{ color: '#666', fontSize: '13px' }}>
                            {bill.date}
                          </span>
                        </div>
                      </div>

                      {/* Right Side - Total and Received */}
                      <div style={{
                        textAlign: 'right',
                        minWidth: '150px',
                        paddingLeft: '16px'
                      }}>
                        <div style={{ marginBottom: '8px' }}>
                          <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#666' }}>
                            Total
                          </p>
                          <p style={{ 
                            margin: '0',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: '#2196f3'
                          }}>
                            ₹{bill.total}
                          </p>
                        </div>
                        {bill.receivedAmount && (
                          <div>
                            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#666' }}>
                              Received
                            </p>
                            <p style={{ 
                              margin: '0',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              color: '#4caf50'
                            }}>
                              ₹{bill.receivedAmount}
                            </p>
                          </div>
                        )}
                        
                        {/* Service Types Below */}
                        {bill.serviceTypes && bill.serviceTypes.length > 0 && (
                          <div style={{
                            marginTop: '12px',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '6px',
                            justifyContent: 'flex-end'
                          }}>
                            {bill.serviceTypes.map((service, idx) => {
                              // Different colors for each service type
                              const serviceColors = {
                                'Tent': { bg: '#FF6B6B', text: 'white' },
                                'Palace': { bg: '#4ECDC4', text: 'white' },
                                'DJ': { bg: '#FFD93D', text: '#333' },
                                'Roadlight': { bg: '#6C5CE7', text: 'white' }
                              };
                              const colors = serviceColors[service] || { bg: '#95E1D3', text: 'white' };
                              
                              return (
                                <span
                                  key={idx}
                                  style={{
                                    background: colors.bg,
                                    color: colors.text,
                                    padding: '6px 12px',
                                    borderRadius: '16px',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    whiteSpace: 'nowrap',
                                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
                                    transition: 'all 0.3s ease'
                                  }}
                                >
                                  {service}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Selected Bill Details */}
          {selectedBill && (
            <div className="section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ margin: 0 }}>Bill Details</h2>
                <button
                  onClick={() => setSelectedBill(null)}
                  style={{
                    background: '#9e9e9e',
                    color: 'white',
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  ← Back to Bills
                </button>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: '8px 0', fontSize: '14px' }}>
                  <strong>Customer Name:</strong> {selectedBill.customerName}
                </p>
                <p style={{ margin: '8px 0', fontSize: '14px' }}>
                  <strong>Event Date:</strong> {selectedBill.date}
                </p>
                <p style={{ margin: '8px 0', fontSize: '14px' }}>
                  <strong>Status:</strong> <span style={{ color: selectedBill.status === 'pending' ? '#f44336' : selectedBill.status === 'approved' ? '#4caf50' : '#ff9800' }}>
                    {selectedBill.status.toUpperCase()}
                  </span>
                </p>
              </div>

              {selectedBill.items && selectedBill.items.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '14px', marginBottom: '12px' }}>Items Details</h3>
                  <div style={{ border: '1px solid #ddd', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr 1fr',
                      gap: '12px',
                      padding: '12px',
                      background: '#f5f5f5',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      borderBottom: '2px solid #ddd'
                    }}>
                      <div>Item Name</div>
                      <div style={{ textAlign: 'center' }}>Qty</div>
                      <div style={{ textAlign: 'center' }}>Rate</div>
                      <div style={{ textAlign: 'right' }}>Amount</div>
                    </div>

                    {selectedBill.items.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '2fr 1fr 1fr 1fr',
                          gap: '12px',
                          padding: '12px',
                          borderBottom: '1px solid #eee',
                          fontSize: '13px'
                        }}
                      >
                        <div>{item.name}</div>
                        <div style={{ textAlign: 'center' }}>{item.quantity}</div>
                        <div style={{ textAlign: 'center' }}>₹{item.rate}</div>
                        <div style={{ textAlign: 'right', fontWeight: 'bold', color: '#2196f3' }}>
                          ₹{item.rate * item.quantity}
                        </div>
                      </div>
                    ))}

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr 1fr',
                      gap: '12px',
                      padding: '12px',
                      background: '#f0f0f0',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      borderTop: '2px solid #ddd'
                    }}>
                      <div>Total Items: {selectedBill.items.reduce((sum, item) => sum + item.quantity, 0)}</div>
                      <div></div>
                      <div></div>
                      <div style={{ textAlign: 'right', color: '#2196f3' }}>
                        ₹{selectedBill.total}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div style={{
                background: '#e3f2fd',
                padding: '16px',
                borderRadius: '6px',
                textAlign: 'right'
              }}>
                <h3 style={{ margin: '0', fontSize: '16px', fontWeight: 'bold', color: '#1976d2' }}>
                  Total Amount: ₹{selectedBill.total}
                </h3>
              </div>

              {selectedBill.receivedAmount && (
                <div style={{
                  background: '#e8f5e9',
                  padding: '16px',
                  borderRadius: '6px',
                  marginTop: '16px',
                  border: '2px solid #4caf50'
                }}>
                  <h3 style={{ marginBottom: '12px', fontSize: '14px', color: '#2e7d32' }}>
                    Payment Details
                  </h3>
                  <p style={{ margin: '8px 0', fontSize: '13px' }}>
                    <strong>Total Amount:</strong> ₹{selectedBill.total}
                  </p>
                  <p style={{ margin: '8px 0', fontSize: '13px' }}>
                    <strong>Received Amount:</strong> ₹{selectedBill.receivedAmount}
                  </p>
                  <p style={{ margin: '8px 0', fontSize: '13px' }}>
                    <strong>Balance:</strong> <span style={{ color: selectedBill.total - selectedBill.receivedAmount > 0 ? '#f44336' : '#4caf50' }}>
                      ₹{selectedBill.total - selectedBill.receivedAmount}
                    </span>
                  </p>
                </div>
              )}

              {selectedBill.serviceTypes && selectedBill.serviceTypes.length > 0 && (
                <div style={{
                  background: '#f3e5f5',
                  padding: '16px',
                  borderRadius: '6px',
                  marginTop: '16px',
                  border: '2px solid #9c27b0'
                }}>
                  <h3 style={{ marginBottom: '12px', fontSize: '14px', color: '#6a1b9a' }}>
                    Service Types
                  </h3>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    {selectedBill.serviceTypes.map((service, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: '#9c27b0',
                          color: 'white',
                          padding: '8px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
