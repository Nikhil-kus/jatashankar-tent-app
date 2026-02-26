import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getBillById } from '../services/firestoreService';
import '../styles/pages.css';

export default function ViewBill() {
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');
    const navigate = useNavigate();
    const [bill, setBill] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBill = async () => {
            try {
                const billData = await getBillById(id);
                if (billData) {
                    setBill(billData);
                } else {
                    setError('Bill not found');
                }
            } catch (err) {
                setError('Error loading bill');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchBill();
        }
    }, [id]);

    const handleDownload = () => {
        window.print();
    };

    if (loading) return <div className="loading">Loading bill details...</div>;
    if (error) return <div className="error-message" style={{ textAlign: 'center', marginTop: '50px' }}>{error}</div>;
    if (!bill) return <div className="error-message">Bill not found</div>;

    return (
        <div className="view-bill-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            <div className="no-print" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => navigate('/')} className="btn-secondary">
                    Go Home
                </button>
                <button onClick={handleDownload} className="btn-primary">
                    Download / Print
                </button>
            </div>

            <div className="bill-paper" style={{
                background: 'white',
                padding: '40px',
                boxShadow: '0 0 20px rgba(0,0,0,0.1)',
                borderRadius: '8px'
            }}>
                {/* Bill Header */}
                <div style={{ textAlign: 'center', borderBottom: '2px solid #2196f3', paddingBottom: '20px', marginBottom: '30px' }}>
                    <h1 style={{ color: '#2196f3', margin: '0 0 10px 0' }}>JATA SHANKAR TENT HOUSE</h1>
                    <p style={{ margin: '0', color: '#666' }}>Bill Invoice</p>
                </div>

                {/* Customer Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>To:</h3>
                        <p style={{ margin: '5px 0' }}><strong>{bill.customerName}</strong></p>
                        {bill.mobileNumber && <p style={{ margin: '5px 0' }}>Mobile: {bill.mobileNumber}</p>}
                        {bill.address && <p style={{ margin: '5px 0' }}>Address: {bill.address}</p>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: '5px 0' }}><strong>Date:</strong> {bill.date}</p>
                        <p style={{ margin: '5px 0' }}>
                            <strong>Status:</strong>
                            <span style={{
                                color: bill.status === 'approved' ? '#4caf50' : bill.status === 'pending' ? '#ff9800' : '#f44336',
                                fontWeight: 'bold',
                                marginLeft: '8px'
                            }}>
                                {bill.status.toUpperCase()}
                            </span>
                        </p>
                        <p style={{ margin: '5px 0', fontSize: '12px', color: '#999' }}>ID: {bill.id.slice(0, 8)}...</p>
                    </div>
                </div>

                {/* Items Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                    <thead>
                        <tr style={{ background: '#f5f5f5' }}>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Item Description</th>
                            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Qty</th>
                            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Rate</th>
                            <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bill.isQuickBill && bill.serviceTypes && bill.serviceTypes.length > 0 && (
                            bill.serviceAmounts ? (
                                bill.serviceTypes.map(service => (
                                    <tr key={`service-${service}`} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '12px' }}><strong>Service Booking:</strong> {service}</td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>-</td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>-</td>
                                        <td style={{ padding: '12px', textAlign: 'right' }}>₹{bill.serviceAmounts[service] || 0}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '12px' }}><strong>Service Booking:</strong> {bill.serviceTypes.join(', ')}</td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>-</td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>-</td>
                                    <td style={{ padding: '12px', textAlign: 'right' }}>₹{bill.baseTotalEntered || bill.total}</td>
                                </tr>
                            )
                        )}
                        {(bill.items || []).map((item, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '12px' }}>{item.name}</td>
                                <td style={{ padding: '12px', textAlign: 'center' }}>{item.quantity}</td>
                                <td style={{ padding: '12px', textAlign: 'center' }}>₹{item.rate}</td>
                                <td style={{ padding: '12px', textAlign: 'right' }}>₹{item.rate * item.quantity}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr style={{ background: '#f9f9f9', fontWeight: 'bold' }}>
                            <td colSpan="3" style={{ padding: '12px', textAlign: 'right' }}>Total Amount:</td>
                            <td style={{ padding: '12px', textAlign: 'right', color: '#2196f3', fontSize: '18px' }}>₹{bill.total}</td>
                        </tr>
                    </tfoot>
                </table>

                {/* Summary */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ width: '300px', background: '#f9f9f9', padding: '20px', borderRadius: '4px' }}>
                        {bill.receivedAmount ? (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <span>Received Amount:</span>
                                    <span style={{ color: '#4caf50', fontWeight: 'bold' }}>₹{bill.receivedAmount}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ddd', paddingTop: '10px' }}>
                                    <span>Balance Due:</span>
                                    <span style={{
                                        color: (bill.total - bill.receivedAmount) > 0 ? '#f44336' : '#4caf50',
                                        fontWeight: 'bold'
                                    }}>
                                        ₹{bill.total - bill.receivedAmount}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Balance Due:</span>
                                <span style={{ color: '#f44336', fontWeight: 'bold' }}>₹{bill.total}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div style={{ marginTop: '50px', textAlign: 'center', color: '#999', fontSize: '12px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                    <p>Thank you for choosing Jata Shankar Tent House!</p>
                    <p>Contact: +91 9691809544 | www.jatashankartent.in</p>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
        @media print {
          .no-print { display: none !important; }
          .view-bill-container { padding: 0 !important; margin: 0 !important; width: 100% !important; max-width: none !important; }
          .bill-paper { box-shadow: none !important; padding: 20px !important; }
          body { background: white !important; }
        }
      `}</style>
        </div>
    );
}
