import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAllBills, getBillById, updateBillStatus, createBooking } from '../services/firestoreService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import '../styles/pages.css';

export default function Bills() {
  const [bills, setBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('approved'); // Changed from 'all' to 'approved'
  const [updating, setUpdating] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState('');
  const [editingReceivedAmount, setEditingReceivedAmount] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchBills();
    
    // If bill ID in URL, select it
    const billId = searchParams.get('id');
    if (billId) {
      loadBillDetails(billId);
    }
  }, [searchParams]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const billsData = await getAllBills();
      setBills(billsData);
    } catch (err) {
      setError('Failed to load bills');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadBillDetails = async (billId) => {
    try {
      const bill = await getBillById(billId);
      setSelectedBill(bill);
      setReceivedAmount(bill.receivedAmount || '');
      setEditingReceivedAmount(false);
    } catch (err) {
      console.error('Error loading bill:', err);
    }
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
      await fetchBills();
      setSelectedBill(null);
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
      await fetchBills();
      setSelectedBill(null);
      alert('Bill rejected');
    } catch (err) {
      setError('Failed to reject bill: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  // Save received amount
  const handleSaveReceivedAmount = async (billId) => {
    if (!receivedAmount || isNaN(receivedAmount)) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setUpdating(true);
      const billRef = doc(db, 'bills', billId);
      await updateDoc(billRef, {
        receivedAmount: parseFloat(receivedAmount)
      });

      // Update local state
      setSelectedBill({
        ...selectedBill,
        receivedAmount: parseFloat(receivedAmount)
      });

      setBills(bills.map(bill =>
        bill.id === billId 
          ? { ...bill, receivedAmount: parseFloat(receivedAmount) }
          : bill
      ));

      setEditingReceivedAmount(false);
      alert('Received amount updated!');
    } catch (err) {
      setError('Failed to update received amount: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  // Share bill via WhatsApp
  const handleShareWhatsApp = (bill) => {
    if (!bill) return;

    // Create HTML content for the bill (same as download)
    const billHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Bill - ${bill.customerName}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #2196f3;
            padding-bottom: 15px;
          }
          .header h1 {
            margin: 0;
            color: #2196f3;
          }
          .header p {
            margin: 5px 0;
            color: #666;
          }
          .bill-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            flex-wrap: wrap;
          }
          .info-block {
            flex: 1;
            min-width: 200px;
            margin-bottom: 10px;
          }
          .info-block label {
            font-weight: bold;
            color: #2196f3;
          }
          .info-block value {
            display: block;
            margin-top: 5px;
            font-size: 14px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th {
            background-color: #f5f5f5;
            padding: 10px;
            text-align: left;
            border: 1px solid #ddd;
            font-weight: bold;
          }
          td {
            padding: 10px;
            border: 1px solid #ddd;
          }
          .total-row {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          .summary {
            margin-top: 30px;
            padding: 15px;
            background-color: #f9f9f9;
            border-left: 4px solid #2196f3;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            font-size: 16px;
          }
          .summary-row.total {
            font-weight: bold;
            color: #2196f3;
            font-size: 18px;
            border-top: 2px solid #ddd;
            padding-top: 10px;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            color: #999;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>JATA SHANKAR TENT HOUSE</h1>
          <p>Bill Details</p>
        </div>

        <div class="bill-info">
          <div class="info-block">
            <label>Customer Name:</label>
            <value>${bill.customerName}</value>
          </div>
          <div class="info-block">
            <label>Event Date:</label>
            <value>${bill.date}</value>
          </div>
          <div class="info-block">
            <label>Bill Status:</label>
            <value>${bill.status.toUpperCase()}</value>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th style="text-align: center;">Quantity</th>
              <th style="text-align: center;">Rate</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${bill.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: center;">₹${item.rate}</td>
                <td style="text-align: right;">₹${item.rate * item.quantity}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="3">Total Items: ${bill.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
              <td style="text-align: right;">₹${bill.total}</td>
            </tr>
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-row">
            <span>Total Amount:</span>
            <span>₹${bill.total}</span>
          </div>
          ${bill.receivedAmount ? `
            <div class="summary-row">
              <span>Received Amount:</span>
              <span>₹${bill.receivedAmount}</span>
            </div>
            <div class="summary-row">
              <span>Balance:</span>
              <span>₹${bill.total - bill.receivedAmount}</span>
            </div>
          ` : ''}
          ${bill.serviceTypes && bill.serviceTypes.length > 0 ? `
            <div class="summary-row">
              <span>Service Types:</span>
              <span>${bill.serviceTypes.join(', ')}</span>
            </div>
          ` : ''}
        </div>

        <div class="footer">
          <p>Generated on ${new Date().toLocaleString()}</p>
          <p>This is a computer-generated document</p>
        </div>
      </body>
      </html>
    `;

    // Create blob and generate download link
    const blob = new Blob([billHTML], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const fileName = `Bill_${bill.customerName}_${bill.date}.html`;
    
    // Create WhatsApp message with file link
    const whatsappMessage = `
*JATA SHANKAR TENT HOUSE - BILL*

*Customer:* ${bill.customerName}
*Event Date:* ${bill.date}
*Status:* ${bill.status.toUpperCase()}

*Total Amount:* ₹${bill.total}
${bill.receivedAmount ? `*Received Amount:* ₹${bill.receivedAmount}\n*Balance:* ₹${bill.total - bill.receivedAmount}` : ''}

📎 Bill attached as file: ${fileName}
    `.trim();

    // For mobile: Try to share using Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: `Bill - ${bill.customerName}`,
        text: whatsappMessage,
        files: [new File([blob], fileName, { type: 'text/html' })]
      }).catch(err => {
        // Fallback: Open WhatsApp with text message
        const encodedMessage = encodeURIComponent(whatsappMessage);
        window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
      });
    } else {
      // Desktop: Download and show WhatsApp message
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Open WhatsApp with message
      const encodedMessage = encodeURIComponent(whatsappMessage);
      window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
      
      window.URL.revokeObjectURL(url);
    }
  };

  // Download bill as PDF
  const handleDownloadBill = (bill) => {
    if (!bill) return;

    // Create HTML content for the bill
    const billHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Bill - ${bill.customerName}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #2196f3;
            padding-bottom: 15px;
          }
          .header h1 {
            margin: 0;
            color: #2196f3;
          }
          .header p {
            margin: 5px 0;
            color: #666;
          }
          .bill-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            flex-wrap: wrap;
          }
          .info-block {
            flex: 1;
            min-width: 200px;
            margin-bottom: 10px;
          }
          .info-block label {
            font-weight: bold;
            color: #2196f3;
          }
          .info-block value {
            display: block;
            margin-top: 5px;
            font-size: 14px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th {
            background-color: #f5f5f5;
            padding: 10px;
            text-align: left;
            border: 1px solid #ddd;
            font-weight: bold;
          }
          td {
            padding: 10px;
            border: 1px solid #ddd;
          }
          .total-row {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          .summary {
            margin-top: 30px;
            padding: 15px;
            background-color: #f9f9f9;
            border-left: 4px solid #2196f3;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            font-size: 16px;
          }
          .summary-row.total {
            font-weight: bold;
            color: #2196f3;
            font-size: 18px;
            border-top: 2px solid #ddd;
            padding-top: 10px;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            color: #999;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>JATA SHANKAR TENT HOUSE</h1>
          <p>Bill Details</p>
        </div>

        <div class="bill-info">
          <div class="info-block">
            <label>Customer Name:</label>
            <value>${bill.customerName}</value>
          </div>
          <div class="info-block">
            <label>Event Date:</label>
            <value>${bill.date}</value>
          </div>
          <div class="info-block">
            <label>Bill Status:</label>
            <value>${bill.status.toUpperCase()}</value>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th style="text-align: center;">Quantity</th>
              <th style="text-align: center;">Rate</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${bill.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: center;">₹${item.rate}</td>
                <td style="text-align: right;">₹${item.rate * item.quantity}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="3">Total Items: ${bill.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
              <td style="text-align: right;">₹${bill.total}</td>
            </tr>
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-row">
            <span>Total Amount:</span>
            <span>₹${bill.total}</span>
          </div>
          ${bill.receivedAmount ? `
            <div class="summary-row">
              <span>Received Amount:</span>
              <span>₹${bill.receivedAmount}</span>
            </div>
            <div class="summary-row">
              <span>Balance:</span>
              <span>₹${bill.total - bill.receivedAmount}</span>
            </div>
          ` : ''}
          ${bill.serviceTypes && bill.serviceTypes.length > 0 ? `
            <div class="summary-row">
              <span>Service Types:</span>
              <span>${bill.serviceTypes.join(', ')}</span>
            </div>
          ` : ''}
        </div>

        <div class="footer">
          <p>Generated on ${new Date().toLocaleString()}</p>
          <p>This is a computer-generated document</p>
        </div>
      </body>
      </html>
    `;

    // Create blob and download
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
  const filteredBills = bills.filter(bill => {
    if (filter === 'all') return true;
    return bill.status === filter;
  });

  // Sort bills by date and categorize
  const today = new Date().toISOString().split('T')[0];
  
  const sortedAndCategorized = () => {
    const past = [];
    const upcoming = [];
    let nearest = null;

    filteredBills.forEach(bill => {
      if (bill.date < today) {
        past.push(bill);
      } else if (bill.date === today) {
        nearest = bill;
      } else {
        upcoming.push(bill);
      }
    });

    // Sort past bills by date (newest first)
    past.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Sort upcoming bills by date (nearest first)
    upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Combine: past + nearest + upcoming
    const result = [...past];
    if (nearest) result.push(nearest);
    result.push(...upcoming);

    return result;
  };

  const sortedBills = sortedAndCategorized();

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'approved': return '#4caf50';
      case 'rejected': return '#f44336';
      default: return '#999';
    }
  };

  // Calculate balance
  const calculateBalance = (bill) => {
    if (!bill.receivedAmount) return bill.total;
    return bill.total - bill.receivedAmount;
  };

  return (
    <div className="bills-container">
      <header className="page-header">
        <h1>Bills Management</h1>
        <button onClick={() => navigate('/dashboard')} className="btn-back">
          ← Dashboard
        </button>
      </header>

      {error && <div className="error-message">{error}</div>}

      <div className="bills-layout">
        {/* Bills List */}
        <div className="bills-list-section">
          <div className="filter-buttons">
            <button
              onClick={() => setFilter('all')}
              className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
            >
              All ({bills.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={filter === 'pending' ? 'filter-btn active' : 'filter-btn'}
            >
              Pending ({bills.filter(b => b.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={filter === 'approved' ? 'filter-btn active' : 'filter-btn'}
            >
              Approved ({bills.filter(b => b.status === 'approved').length})
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={filter === 'rejected' ? 'filter-btn active' : 'filter-btn'}
            >
              Rejected ({bills.filter(b => b.status === 'rejected').length})
            </button>
          </div>

          {loading ? (
            <div className="loading">Loading bills...</div>
          ) : sortedBills.length === 0 ? (
            <div className="empty-state">No bills found</div>
          ) : (
            <div className="bills-list">
              {sortedBills.map(bill => {
                // Format date to show day and month clearly
                const dateObj = new Date(bill.date + 'T00:00:00');
                const day = dateObj.getDate();
                const month = dateObj.toLocaleString('en-US', { month: 'short' });
                
                // Check if this is today's or nearest upcoming event
                const today = new Date().toISOString().split('T')[0];
                const isNearest = bill.date === today || 
                  (bill.date > today && !sortedBills.some(b => b.date > today && b.date < bill.date));
                
                return (
                  <div
                    key={bill.id}
                    onClick={() => loadBillDetails(bill.id)}
                    className={`bill-list-item ${selectedBill?.id === bill.id ? 'active' : ''}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      background: isNearest ? '#fffde7' : '#f9f9f9',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      borderLeft: isNearest ? '4px solid #fbc02d' : '4px solid #ddd',
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
                            backgroundColor: getStatusColor(bill.status),
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
          )}
        </div>

        {/* Bill Details */}
        {selectedBill && (
          <div className="bill-details-section">
            <div className="bill-details-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ margin: 0 }}>Bill Details</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleDownloadBill(selectedBill)}
                    className="btn-primary"
                    style={{ background: '#2196f3', padding: '8px 16px', fontSize: '13px' }}
                  >
                    ⬇ Download Bill
                  </button>
                  <button
                    onClick={() => handleShareWhatsApp(selectedBill)}
                    className="btn-primary"
                    style={{ background: '#25D366', padding: '8px 16px', fontSize: '13px' }}
                  >
                    💬 Share WhatsApp
                  </button>
                </div>
              </div>
              
              <div className="detail-row">
                <span className="label">Customer Name:</span>
                <span className="value">{selectedBill.customerName}</span>
              </div>

              <div className="detail-row">
                <span className="label">Event Date:</span>
                <span className="value">{selectedBill.date}</span>
              </div>

              <div className="detail-row">
                <span className="label">Status:</span>
                <span
                  className="value"
                  style={{ color: getStatusColor(selectedBill.status) }}
                >
                  {selectedBill.status.toUpperCase()}
                </span>
              </div>

              <h3 style={{ marginTop: '20px', marginBottom: '12px' }}>Items Details</h3>
              <div style={{
                border: '1px solid #ddd',
                borderRadius: '6px',
                overflow: 'hidden'
              }}>
                {/* Table Header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr',
                  gap: '12px',
                  padding: '12px',
                  background: '#f5f5f5',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  borderBottom: '2px solid #ddd'
                }}>
                  <div>Item Name</div>
                  <div style={{ textAlign: 'center' }}>Qty</div>
                  <div style={{ textAlign: 'center' }}>Rate</div>
                  <div style={{ textAlign: 'right' }}>Amount</div>
                </div>

                {/* Table Rows */}
                {selectedBill.items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr 1fr',
                      gap: '12px',
                      padding: '12px',
                      borderBottom: '1px solid #eee',
                      fontSize: '14px'
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

                {/* Total Row */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr',
                  gap: '12px',
                  padding: '12px',
                  background: '#f0f0f0',
                  fontWeight: 'bold',
                  fontSize: '14px',
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

              <div className="bill-total">
                <h3>Total Amount: ₹{selectedBill.total}</h3>
              </div>

              {/* Received Amount Section (for approved bills) */}
              {selectedBill.status === 'approved' && (
                <div style={{
                  background: '#e8f5e9',
                  padding: '16px',
                  borderRadius: '6px',
                  marginTop: '16px',
                  border: '2px solid #4caf50'
                }}>
                  <h3 style={{ marginBottom: '12px', fontSize: '16px', color: '#2e7d32' }}>
                    Payment Details
                  </h3>
                  
                  {!editingReceivedAmount ? (
                    <div>
                      <div className="detail-row" style={{ marginBottom: '12px' }}>
                        <span className="label">Total Amount:</span>
                        <span className="value">₹{selectedBill.total}</span>
                      </div>
                      <div className="detail-row" style={{ marginBottom: '12px' }}>
                        <span className="label">Received Amount:</span>
                        <span className="value" style={{ color: '#4caf50', fontWeight: 'bold' }}>
                          ₹{selectedBill.receivedAmount || 0}
                        </span>
                      </div>
                      <div className="detail-row" style={{ marginBottom: '12px' }}>
                        <span className="label">Balance:</span>
                        <span className="value" style={{ 
                          color: calculateBalance(selectedBill) > 0 ? '#f44336' : '#4caf50',
                          fontWeight: 'bold'
                        }}>
                          ₹{calculateBalance(selectedBill)}
                        </span>
                      </div>
                      <button
                        onClick={() => setEditingReceivedAmount(true)}
                        className="btn-primary"
                        style={{ width: '100%', marginTop: '12px' }}
                      >
                        Update Received Amount
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                          Received Amount (₹) *
                        </label>
                        <input
                          type="number"
                          value={receivedAmount}
                          onChange={(e) => setReceivedAmount(e.target.value)}
                          placeholder="Enter received amount"
                          step="0.01"
                          min="0"
                          max={selectedBill.total}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #4caf50',
                            borderRadius: '4px',
                            fontSize: '14px',
                            fontFamily: 'inherit'
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          onClick={() => handleSaveReceivedAmount(selectedBill.id)}
                          disabled={updating}
                          className="btn-approve"
                          style={{ flex: 1 }}
                        >
                          {updating ? 'Saving...' : 'Save Amount'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingReceivedAmount(false);
                            setReceivedAmount(selectedBill.receivedAmount || '');
                          }}
                          disabled={updating}
                          className="btn-cancel"
                          style={{ flex: 1 }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Service Types (for quick bills created by owner) */}
              {selectedBill.isQuickBill && selectedBill.serviceTypes && selectedBill.serviceTypes.length > 0 && (
                <div style={{
                  background: '#f3e5f5',
                  padding: '16px',
                  borderRadius: '6px',
                  marginTop: '16px',
                  border: '2px solid #9c27b0'
                }}>
                  <h3 style={{ marginBottom: '12px', fontSize: '16px', color: '#6a1b9a' }}>
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
                          fontSize: '13px',
                          fontWeight: 'bold'
                        }}
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedBill.status === 'pending' && (
                <div className="action-buttons">
                  <button
                    onClick={() => handleApproveBill(selectedBill.id)}
                    disabled={updating}
                    className="btn-approve"
                  >
                    {updating ? 'Processing...' : 'Approve & Confirm Booking'}
                  </button>
                  <button
                    onClick={() => handleRejectBill(selectedBill.id)}
                    disabled={updating}
                    className="btn-reject"
                  >
                    {updating ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
