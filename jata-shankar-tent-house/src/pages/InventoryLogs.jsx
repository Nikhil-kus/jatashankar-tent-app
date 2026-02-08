import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getBillById, updateBill } from '../services/firestoreService';
import '../styles/pages.css';

export default function InventoryLogs() {
    const [searchParams] = useSearchParams();
    const billId = searchParams.get('id');

    const [bill, setBill] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [items, setItems] = useState([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (billId) {
            fetchBill();
        } else {
            setError('No bill ID provided');
            setLoading(false);
        }
    }, [billId]);

    const fetchBill = async () => {
        try {
            setLoading(true);
            const billData = await getBillById(billId);
            if (billData) {
                setBill(billData);
                // Initialize items with existing out/in data or defaults
                setItems(billData.items.map(item => ({
                    ...item,
                    outQty: item.outQty || 0,
                    inQty: item.inQty || 0
                })));
            } else {
                setError('Bill not found');
            }
        } catch (err) {
            setError('Failed to load bill');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOutQtyChange = (itemId, val) => {
        const qty = parseInt(val) || 0;
        setItems(items.map(item =>
            item.id === itemId ? { ...item, outQty: qty } : item
        ));
    };

    const handleInQtyChange = (itemId, val) => {
        const qty = parseInt(val) || 0;
        setItems(items.map(item =>
            item.id === itemId ? { ...item, inQty: qty } : item
        ));
    };

    const handleOutCheckbox = (itemId, checked, maxQty) => {
        setItems(items.map(item =>
            item.id === itemId ? { ...item, outQty: checked ? maxQty : 0 } : item
        ));
    };

    const handleInCheckbox = (itemId, checked, maxQty) => {
        setItems(items.map(item =>
            item.id === itemId ? { ...item, inQty: checked ? maxQty : 0 } : item
        ));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            // We only need to update the items array in the bill
            // Construct the updated bill object with modified items
            // Note: We should be careful not to overwrite other fields if they changed,
            // but for this simple app, updating the whole bill items list is acceptable 
            // as this page is likely the only one editing these specific fields.

            const updatedBill = {
                ...bill,
                items: items
            };

            await updateBill(billId, updatedBill);
            alert('Inventory logs updated successfully!');
        } catch (err) {
            console.error('Error saving inventory:', err);
            alert('Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    const getItemBackgroundColor = (item) => {
        // Priority 1: Items sent out but not returned (In != Out) -> RED
        if (item.inQty !== item.outQty) {
            return '#ffebee'; // Light Red
        }
        // Priority 2: Items booked but not fully sent (Out != Booked) -> YELLOW
        if (item.outQty !== item.quantity) {
            return '#fffde7'; // Light Yellow
        }
        // Default: All good -> WHITE
        return 'white';
    };

    if (loading) return <div className="loading">Loading inventory details...</div>;
    if (error) return <div className="error-message" style={{ margin: '20px' }}>{error}</div>;

    return (
        <div className="page-container" style={{ padding: '16px', maxWidth: '800px', margin: '0 auto' }}>
            <header style={{ marginBottom: '24px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>Inventory Logs</h1>
                <p style={{ color: '#666' }}>
                    Customer: <strong>{bill.customerName}</strong>
                </p>
                <p style={{ color: '#666', fontSize: '14px' }}>
                    Date: {bill.date}
                </p>
            </header>

            <div className="inventory-list">
                {items.map(item => (
                    <div key={item.id} style={{
                        background: getItemBackgroundColor(item),
                        borderRadius: '8px',
                        padding: '16px',
                        marginBottom: '16px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        border: '1px solid #eee'
                    }}>
                        <h3 style={{ margin: '0 0 12px 0', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '8px' }}>
                            {item.name}
                        </h3>

                        {/* Row 1: Actual Quantity */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span style={{ fontWeight: '500', color: '#555' }}>Booked Quantity:</span>
                            <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{item.quantity}</span>
                        </div>

                        {/* Row 2: OUT */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            background: 'rgba(255, 243, 224, 0.5)', // Transparent Orange
                            padding: '8px',
                            borderRadius: '6px',
                            marginBottom: '8px'
                        }}>
                            <div style={{ width: '80px', fontWeight: 'bold', color: '#E65100' }}>OUT</div>
                            <input
                                type="checkbox"
                                checked={item.outQty === item.quantity}
                                onChange={(e) => handleOutCheckbox(item.id, e.target.checked, item.quantity)}
                                style={{ width: '20px', height: '20px' }}
                            />
                            <input
                                type="number"
                                value={item.outQty}
                                onChange={(e) => handleOutQtyChange(item.id, e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: '8px',
                                    borderRadius: '4px',
                                    border: '1px solid #ddd',
                                    fontWeight: 'bold'
                                }}
                            />
                        </div>

                        {/* Row 3: IN */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            background: '#E8F5E9',
                            padding: '8px',
                            borderRadius: '6px'
                        }}>
                            <div style={{ width: '80px', fontWeight: 'bold', color: '#1B5E20' }}>IN</div>
                            <input
                                type="checkbox"
                                checked={item.inQty === item.quantity}
                                onChange={(e) => handleInCheckbox(item.id, e.target.checked, item.quantity)}
                                style={{ width: '20px', height: '20px' }}
                            />
                            <input
                                type="number"
                                value={item.inQty}
                                onChange={(e) => handleInQtyChange(item.id, e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: '8px',
                                    borderRadius: '4px',
                                    border: '1px solid #ddd',
                                    fontWeight: 'bold'
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ position: 'sticky', bottom: '20px', padding: '0 16px' }}>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary"
                    style={{
                        width: '100%',
                        padding: '16px',
                        fontSize: '18px',
                        boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)'
                    }}
                >
                    {saving ? 'Saving...' : 'Save Inventory Logs'}
                </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '40px', color: '#999', fontSize: '12px' }}>
                <p>Jata Shankar Tent House Inventory System</p>
            </div>
        </div>
    );
}
