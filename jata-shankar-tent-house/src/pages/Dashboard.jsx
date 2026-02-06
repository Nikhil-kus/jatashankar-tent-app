import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../services/authService';
import { getAllBills, getAllBookings, createBill, createBooking, updateBillStatus, getItems } from '../services/firestoreService';
import { db } from '../firebase/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import '../styles/pages.css';

export default function Dashboard() {
  const [bills, setBills] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showQuickBill, setShowQuickBill] = useState(false);
  const [showDetailedBill, setShowDetailedBill] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null); // Add selected bill state
  const [showMenu, setShowMenu] = useState(false); // Add menu state
  const [quickBillData, setQuickBillData] = useState({
    customerName: '',
    mobileNumber: '',
    date: '',
    totalAmount: '',
    receivedAmount: '',
    serviceTypes: [] // Add service types
  });
  const [detailedBillData, setDetailedBillData] = useState({
    customerName: '',
    mobileNumber: '',
    date: '',
    items: []
  });
  const [updating, setUpdating] = useState(false);
  const [editingPayment, setEditingPayment] = useState(false);
  const [newReceivedAmount, setNewReceivedAmount] = useState('');
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

  // Handle browser back button
  useEffect(() => {
    const handlePopState = (event) => {
      // Logic to close modals when back button is pressed
      // We check if we should close any open modal
      if (selectedBill || showQuickBill || showDetailedBill) {
        setSelectedBill(null);
        setShowQuickBill(false);
        setShowDetailedBill(false);
        setShowMenu(false);
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [selectedBill, showQuickBill, showDetailedBill]);

  // Helper to open modal with history push
  const openModal = (type, data = null) => {
    // Push state so back button works
    window.history.pushState({ modal: type }, '');

    if (type === 'bill_details') {
      setSelectedBill(data);
    } else if (type === 'quick_bill') {
      setShowQuickBill(true);
    } else if (type === 'detailed_bill') {
      setShowDetailedBill(true);
    }
  };

  // Helper to close modal (triggers back)
  const closeModal = () => {
    window.history.back();
    // State clearing will happen in popstate listener, 
    // BUT to feel responsive we can also clear immediately if needed,
    // however, let's rely on the popstate listener for consistent logic 
    // OR trigger the state change manually if we want to be safe against double-backs.
    // Actually, safest is: user clicks close -> history.back() -> popstate fires -> cleanup.
  };

  // Share bill via WhatsApp (same as Bills.jsx)
  const handleShareWhatsAppDashboard = (bill) => {
    if (!bill) return;

    // Create HTML content for the bill
    const billHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Bill - ${bill.customerName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2196f3; padding-bottom: 15px; }
          .header h1 { margin: 0; color: #2196f3; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background-color: #f5f5f5; padding: 10px; text-align: left; border: 1px solid #ddd; font-weight: bold; }
          td { padding: 10px; border: 1px solid #ddd; }
          .total-row { background-color: #f0f0f0; font-weight: bold; }
          .summary { margin-top: 30px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #2196f3; }
          .summary-row { display: flex; justify-content: space-between; margin: 10px 0; font-size: 16px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>JATA SHANKAR TENT HOUSE</h1>
          <p>Bill Details</p>
        </div>
        <p><strong>Customer:</strong> ${bill.customerName}</p>
        <p><strong>Date:</strong> ${bill.date}</p>
        <p><strong>Status:</strong> ${bill.status.toUpperCase()}</p>
        <table>
          <thead>
            <tr><th>Item Name</th><th>Qty</th><th>Rate</th><th>Amount</th></tr>
          </thead>
          <tbody>
            ${bill.items.map(item => `<tr><td>${item.name}</td><td>${item.quantity}</td><td>₹${item.rate}</td><td>₹${item.rate * item.quantity}</td></tr>`).join('')}
            <tr class="total-row"><td colspan="3">Total Items: ${bill.items.reduce((sum, item) => sum + item.quantity, 0)}</td><td>₹${bill.total}</td></tr>
          </tbody>
        </table>
        <div class="summary">
          <div class="summary-row"><span>Total Amount:</span><span>₹${bill.total}</span></div>
          ${bill.receivedAmount ? `<div class="summary-row"><span>Received:</span><span>₹${bill.receivedAmount}</span></div><div class="summary-row"><span>Balance:</span><span>₹${bill.total - bill.receivedAmount}</span></div>` : ''}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([billHTML], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const fileName = `Bill_${bill.customerName}_${bill.date}.html`;

    const whatsappMessage = `*JATA SHANKAR TENT HOUSE - BILL*\n\n*Customer:* ${bill.customerName}\n*Date:* ${bill.date}\n*Total:* ₹${bill.total}\n${bill.receivedAmount ? `*Received:* ₹${bill.receivedAmount}\n*Balance:* ₹${bill.total - bill.receivedAmount}` : ''}\n\n📎 Bill attached`;

    if (navigator.share) {
      navigator.share({
        title: `Bill - ${bill.customerName}`,
        text: whatsappMessage,
        files: [new File([blob], fileName, { type: 'text/html' })]
      }).catch(err => {
        const encodedMessage = encodeURIComponent(whatsappMessage);
        const phoneNumber = bill.mobileNumber ? `91${bill.mobileNumber}` : '';
        const url = phoneNumber ? `https://wa.me/${phoneNumber}?text=${encodedMessage}` : `https://wa.me/?text=${encodedMessage}`;
        window.open(url, '_blank');
      });
    } else {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      const encodedMessage = encodeURIComponent(whatsappMessage);
      const phoneNumber = bill.mobileNumber ? `91${bill.mobileNumber}` : '';
      const waUrl = phoneNumber ? `https://wa.me/${phoneNumber}?text=${encodedMessage}` : `https://wa.me/?text=${encodedMessage}`;
      window.open(waUrl, '_blank');

      window.URL.revokeObjectURL(url);
    }
  };

  // Download bill as HTML
  const handleDownloadBillDashboard = (bill) => {
    if (!bill) return;

    const billHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Bill - ${bill.customerName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2196f3; padding-bottom: 15px; }
          .header h1 { margin: 0; color: #2196f3; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background-color: #f5f5f5; padding: 10px; text-align: left; border: 1px solid #ddd; font-weight: bold; }
          td { padding: 10px; border: 1px solid #ddd; }
          .total-row { background-color: #f0f0f0; font-weight: bold; }
          .summary { margin-top: 30px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #2196f3; }
          .summary-row { display: flex; justify-content: space-between; margin: 10px 0; font-size: 16px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>JATA SHANKAR TENT HOUSE</h1>
          <p>Bill Details</p>
        </div>
        <p><strong>Customer:</strong> ${bill.customerName}</p>
        <p><strong>Date:</strong> ${bill.date}</p>
        <p><strong>Status:</strong> ${bill.status.toUpperCase()}</p>
        <table>
          <thead>
            <tr><th>Item Name</th><th>Qty</th><th>Rate</th><th>Amount</th></tr>
          </thead>
          <tbody>
            ${bill.items.map(item => `<tr><td>${item.name}</td><td>${item.quantity}</td><td>₹${item.rate}</td><td>₹${item.rate * item.quantity}</td></tr>`).join('')}
            <tr class="total-row"><td colspan="3">Total Items: ${bill.items.reduce((sum, item) => sum + item.quantity, 0)}</td><td>₹${bill.total}</td></tr>
          </tbody>
        </table>
        <div class="summary">
          <div class="summary-row"><span>Total Amount:</span><span>₹${bill.total}</span></div>
          ${bill.receivedAmount ? `<div class="summary-row"><span>Received:</span><span>₹${bill.receivedAmount}</span></div><div class="summary-row"><span>Balance:</span><span>₹${bill.total - bill.receivedAmount}</span></div>` : ''}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([billHTML], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bill_${bill.customerName}_${bill.date}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
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
        mobileNumber: quickBillData.mobileNumber.trim(),
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
        mobileNumber: '',
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
        mobileNumber: detailedBillData.mobileNumber.trim(),
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
        mobileNumber: '',
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

  const handleApproveBill = async (billId) => {
    if (!window.confirm('Approve this bill and create booking?')) return;

    try {
      setUpdating(true);
      await updateBillStatus(billId, 'approved');

      // Create booking
      const bill = bills.find(b => b.id === billId);
      await createBooking({
        date: bill.date,
        billId: billId,
        customerName: bill.customerName,
      });

      // Refresh data
      await fetchData();
      setSelectedBill({ ...selectedBill, status: 'approved' });
      alert('Bill approved and booking confirmed!');
    } catch (err) {
      setError('Failed to approve bill: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleRejectBill = async (billId) => {
    if (!window.confirm('Reject this bill?')) return;

    try {
      setUpdating(true);
      await updateBillStatus(billId, 'rejected');
      await fetchData();
      setSelectedBill({ ...selectedBill, status: 'rejected' });
      alert('Bill rejected');
    } catch (err) {
      setError('Failed to reject bill: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePayment = async () => {
    if (!newReceivedAmount || isNaN(newReceivedAmount)) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setUpdating(true);
      const billRef = doc(db, 'bills', selectedBill.id);
      await updateDoc(billRef, {
        receivedAmount: parseFloat(newReceivedAmount)
      });

      // Update local state
      const updatedBill = {
        ...selectedBill,
        receivedAmount: parseFloat(newReceivedAmount)
      };
      setSelectedBill(updatedBill);
      setEditingPayment(false);

      await fetchData();
      alert('Received amount updated!');
    } catch (err) {
      setError('Failed to update payment: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/');
    } catch (err) {
      setError('Failed to logout: ' + err.message);
    }
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
      ) : selectedBill ? (
        // ONLY SHOW BILL DETAILS WHEN A BILL IS SELECTED
        <div className="dashboard-content">
          <div className="section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0 }}>Bill Details</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleDownloadBillDashboard(selectedBill)}
                  className="btn-primary"
                  style={{ background: '#2196f3', padding: '8px 16px', fontSize: '13px' }}
                >
                  ⬇ Download
                </button>
                <button
                  onClick={() => handleShareWhatsAppDashboard(selectedBill)}
                  className="btn-primary"
                  style={{ background: '#25D366', padding: '8px 16px', fontSize: '13px' }}
                >
                  💬 Share
                </button>
                <button
                  onClick={closeModal}
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
                  ← Back
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ margin: '8px 0', fontSize: '14px' }}>
                <strong>Customer Name:</strong> {selectedBill.customerName}
              </p>
              {selectedBill.mobileNumber && (
                <p style={{ margin: '8px 0', fontSize: '14px' }}>
                  <strong>Mobile:</strong> {selectedBill.mobileNumber}
                </p>
              )}
              <p style={{ margin: '8px 0', fontSize: '14px' }}>
                <strong>Event Date:</strong> {selectedBill.date}
              </p>
              <p style={{ margin: '8px 0', fontSize: '14px' }}>
                <strong>Status:</strong> <span style={{ color: selectedBill.status === 'pending' ? '#f44336' : selectedBill.status === 'approved' ? '#4caf50' : '#ff9800' }}>
                  {selectedBill.status.toUpperCase()}
                </span>
              </p>

              {selectedBill.status === 'pending' && (
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleApproveBill(selectedBill.id)}
                    disabled={updating}
                    className="btn-primary"
                    style={{ background: '#4caf50', padding: '6px 12px', fontSize: '12px', flex: 1 }}
                  >
                    {updating ? 'Processing...' : '✓ Approve'}
                  </button>
                  <button
                    onClick={() => handleRejectBill(selectedBill.id)}
                    disabled={updating}
                    className="btn-primary"
                    style={{ background: '#f44336', padding: '6px 12px', fontSize: '12px', flex: 1 }}
                  >
                    {updating ? 'Processing...' : '✕ Reject'}
                  </button>
                </div>
              )}
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

            {/* Payment Details Section (Matches Bills.jsx) */}
            {selectedBill.status === 'approved' && (
              <div style={{
                background: '#e8f5e9',
                padding: '16px',
                borderRadius: '6px',
                marginTop: '16px',
                border: '2px solid #4caf50'
              }}>
                <h3 style={{ marginBottom: '12px', fontSize: '16px', color: '#2e7d32', marginTop: 0 }}>
                  Payment Details
                </h3>

                {!editingPayment ? (
                  <div>
                    <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span style={{ fontWeight: '500' }}>Total Amount:</span>
                      <span>₹{selectedBill.total}</span>
                    </div>
                    <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span style={{ fontWeight: '500' }}>Received Amount:</span>
                      <span style={{ color: '#4caf50', fontWeight: 'bold' }}>
                        ₹{selectedBill.receivedAmount || 0}
                      </span>
                    </div>
                    <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span style={{ fontWeight: '500' }}>Balance:</span>
                      <span style={{
                        color: (selectedBill.total - (selectedBill.receivedAmount || 0)) > 0 ? '#f44336' : '#4caf50',
                        fontWeight: 'bold'
                      }}>
                        ₹{selectedBill.total - (selectedBill.receivedAmount || 0)}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setNewReceivedAmount(selectedBill.receivedAmount || '');
                        setEditingPayment(true);
                      }}
                      className="btn-primary"
                      style={{ width: '100%', marginTop: '8px', background: '#2196f3' }}
                    >
                      Update Received Amount
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '13px' }}>
                        Received Amount (₹) *
                      </label>
                      <input
                        type="number"
                        value={newReceivedAmount}
                        onChange={(e) => setNewReceivedAmount(e.target.value)}
                        placeholder="Enter received amount"
                        step="0.01"
                        min="0"
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #4caf50',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={handleUpdatePayment}
                        disabled={updating}
                        style={{
                          flex: 1,
                          background: '#4caf50',
                          color: 'white',
                          border: 'none',
                          padding: '8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                      >
                        {updating ? 'Saving...' : 'Save Amount'}
                      </button>
                      <button
                        onClick={() => setEditingPayment(false)}
                        disabled={updating}
                        style={{
                          flex: 1,
                          background: '#f44336',
                          color: 'white',
                          border: 'none',
                          padding: '8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
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
        </div>
      ) : (
        // SHOW DASHBOARD CONTENT WHEN NO BILL IS SELECTED
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
              onClick={() => showDetailedBill ? closeModal() : openModal('detailed_bill')}
              className="btn-primary"
              style={{ background: '#10B981', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)', padding: '8px 14px', fontSize: '13px' }}
            >
              {showDetailedBill ? 'Cancel Detailed Bill' : '+ Detailed Bill'}
            </button>
            <button
              onClick={() => showQuickBill ? closeModal() : openModal('quick_bill')}
              className="btn-primary"
              style={{ background: '#F59E0B', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)', padding: '8px 14px', fontSize: '13px' }}
            >
              {showQuickBill ? 'Cancel Quick Bill' : '+ Quick Bill'}
            </button>
            <button
              onClick={() => navigate('/calendar')}
              className="btn-primary"
              style={{ background: '#8B5CF6', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)', padding: '8px 14px', fontSize: '13px' }}
            >
              View Calendar
            </button>
            {/* 3-Dot Menu */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="btn-primary"
                style={{ background: '#6B7280', boxShadow: '0 4px 12px rgba(107, 114, 128, 0.3)', padding: '8px 14px', fontSize: '13px' }}
              >
                ⋮ Menu
              </button>
              {showMenu && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  background: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  zIndex: 1000,
                  minWidth: '200px',
                  marginTop: '4px'
                }}>
                  <button
                    onClick={() => {
                      navigate('/bills');
                      setShowMenu(false);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '12px 16px',
                      border: 'none',
                      background: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px',
                      borderBottom: '1px solid #eee'
                    }}
                  >
                    📋 View All Bills
                  </button>
                  <button
                    onClick={() => {
                      navigate('/items');
                      setShowMenu(false);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '12px 16px',
                      border: 'none',
                      background: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    ðŸ·ï¸ Manage Items & Prices
                  </button>
                </div>
              )}
            </div>
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
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={detailedBillData.mobileNumber}
                      onChange={(e) => setDetailedBillData({ ...detailedBillData, mobileNumber: e.target.value })}
                      placeholder="Enter mobile number"
                      maxLength="10"
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
                              -
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
                      closeModal();
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
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={quickBillData.mobileNumber}
                      onChange={(e) => setQuickBillData({ ...quickBillData, mobileNumber: e.target.value })}
                      placeholder="Enter mobile number"
                      maxLength="10"
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
                      closeModal();
                      setQuickBillData({ customerName: '', date: '', totalAmount: '', receivedAmount: '', serviceTypes: [] });
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

          {/* All Bills - Show list when no bill is selected */}
          {bills.length > 0 && (
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
                      onClick={() => openModal('bill_details', bill)}
                      className={`bill-card ${isNearest ? 'nearest' : bill.status}`}
                    >
                      {/* Left Side - Info */}
                      <div className="bill-card-left">
                        <div className="bill-header-row">
                          <h4 className="customer-name">{bill.customerName}</h4>
                          {isNearest && <span className="nearest-badge">NEAREST</span>}
                        </div>

                        <div className="date-row">
                          <div className={`date-box ${isNearest ? 'nearest' : ''}`}>
                            <span className="date-day">{day}</span>
                            <span className="date-month">{month}</span>
                          </div>
                          <span className="full-date">{bill.date}</span>
                        </div>
                      </div>

                      {/* Middle Side - Services & Actions */}


                      {bill.status === 'pending' && (
                        <div className="bill-card-middle">
                          <div className="action-buttons-row" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleApproveBill(bill.id)}
                              disabled={updating}
                              className="btn-action approve"
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => handleRejectBill(bill.id)}
                              disabled={updating}
                              className="btn-action reject"
                            >
                              ✕ Reject
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Right Side - Amounts & Status */}
                      <div className="bill-card-right">
                        {/* Service Tags Moved Here */}
                        <div className="services-container" style={{ marginBottom: 0, marginRight: 'auto' }}>
                          {bill.serviceTypes && bill.serviceTypes.length > 0 && (
                            <div className="tags-row">
                              {bill.serviceTypes.map((service, idx) => {
                                const serviceColors = {
                                  'Tent': { bg: '#FFEBEE', text: '#D32F2F' },
                                  'Palace': { bg: '#E0F2F1', text: '#00695C' },
                                  'DJ': { bg: '#EEE', text: '#333' },
                                  'Roadlight': { bg: '#EDE7F6', text: '#512DA8' }
                                };
                                const colors = serviceColors[service] || { bg: '#E3F2FD', text: '#1565C0' };
                                return (
                                  <span
                                    key={idx}
                                    className="service-tag"
                                    style={{
                                      backgroundColor: colors.bg,
                                      color: colors.text
                                    }}
                                  >
                                    {service}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <div>
                          <span className={`status-badge`} style={{
                            backgroundColor: bill.status === 'pending' ? '#FF5252' : bill.status === 'approved' ? '#4CAF50' : '#FF9800',
                            textAlign: 'right',
                            display: 'block',
                            width: 'fit-content',
                            marginLeft: 'auto'
                          }}>
                            {bill.status}
                          </span>
                        </div>

                        <div className="amount-group">
                          <p className="total-label">Total</p>
                          <p className="total-amount">₹{bill.total}</p>

                          {bill.receivedAmount && (
                            <div className="received-group">
                              <p className="total-label" style={{ fontSize: '9px' }}>Received</p>
                              <p className="received-amount">₹{bill.receivedAmount}</p>
                            </div>
                          )}
                        </div>


                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )
      }
    </div >
  );
}
