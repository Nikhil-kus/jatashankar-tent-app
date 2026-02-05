# API Reference - Firestore Service Functions

## Authentication Service (`src/services/authService.js`)

### loginUser(email, password)
Login user with email and password.

**Parameters:**
- `email` (string) - User email
- `password` (string) - User password

**Returns:** Promise<User>

**Example:**
```javascript
import { loginUser } from '../services/authService';

try {
  const user = await loginUser('owner@example.com', 'password123');
  console.log('Logged in:', user.email);
} catch (error) {
  console.error('Login failed:', error.message);
}
```

---

### logoutUser()
Logout current user.

**Returns:** Promise<void>

**Example:**
```javascript
import { logoutUser } from '../services/authService';

try {
  await logoutUser();
  console.log('Logged out');
} catch (error) {
  console.error('Logout failed:', error.message);
}
```

---

### subscribeToAuthState(callback)
Subscribe to authentication state changes.

**Parameters:**
- `callback` (function) - Called with user object when auth state changes

**Returns:** Function (unsubscribe function)

**Example:**
```javascript
import { subscribeToAuthState } from '../services/authService';

useEffect(() => {
  const unsubscribe = subscribeToAuthState((user) => {
    if (user) {
      console.log('User logged in:', user.email);
    } else {
      console.log('User logged out');
    }
  });

  return () => unsubscribe();
}, []);
```

---

### getCurrentUser()
Get current authenticated user.

**Returns:** User object or null

**Example:**
```javascript
import { getCurrentUser } from '../services/authService';

const user = getCurrentUser();
if (user) {
  console.log('Current user:', user.email);
}
```

---

## Firestore Service (`src/services/firestoreService.js`)

### Items Collection

#### getItems()
Get all rental items.

**Returns:** Promise<Array>

**Example:**
```javascript
import { getItems } from '../services/firestoreService';

const items = await getItems();
// Returns: [
//   { id: '1', name: 'अरी शीशम 15 x 15', rate: 500 },
//   { id: '2', name: 'शीशम V.I.P', rate: 600 }
// ]
```

---

#### updateItemRate(itemId, newRate)
Update item price.

**Parameters:**
- `itemId` (string) - Item document ID
- `newRate` (number) - New rate

**Returns:** Promise<void>

**Example:**
```javascript
import { updateItemRate } from '../services/firestoreService';

await updateItemRate('item123', 750);
console.log('Rate updated');
```

---

### Bills Collection

#### createBill(billData)
Create a new bill.

**Parameters:**
- `billData` (object) - Bill data:
  ```javascript
  {
    customerName: string,
    date: string (YYYY-MM-DD),
    items: [{ id, name, quantity, rate }],
    total: number
  }
  ```

**Returns:** Promise<string> (Bill ID)

**Example:**
```javascript
import { createBill } from '../services/firestoreService';

const billId = await createBill({
  customerName: 'राज कुमार',
  date: '2024-02-15',
  items: [
    { id: '1', name: 'अरी शीशम 15 x 15', quantity: 2, rate: 500 },
    { id: '2', name: 'शीशम V.I.P', quantity: 1, rate: 600 }
  ],
  total: 1600
});
console.log('Bill created:', billId);
```

---

#### getAllBills()
Get all bills (sorted by newest first).

**Returns:** Promise<Array>

**Example:**
```javascript
import { getAllBills } from '../services/firestoreService';

const bills = await getAllBills();
bills.forEach(bill => {
  console.log(`${bill.customerName} - ${bill.status}`);
});
```

---

#### getBillById(billId)
Get specific bill by ID.

**Parameters:**
- `billId` (string) - Bill document ID

**Returns:** Promise<Object> or null

**Example:**
```javascript
import { getBillById } from '../services/firestoreService';

const bill = await getBillById('bill123');
if (bill) {
  console.log('Bill total:', bill.total);
}
```

---

#### updateBillStatus(billId, status)
Update bill status (approve/reject).

**Parameters:**
- `billId` (string) - Bill document ID
- `status` (string) - 'approved' or 'rejected'

**Returns:** Promise<void>

**Example:**
```javascript
import { updateBillStatus } from '../services/firestoreService';

await updateBillStatus('bill123', 'approved');
console.log('Bill approved');
```

---

#### getBillsByDate(date)
Get bills for specific date.

**Parameters:**
- `date` (string) - Date in YYYY-MM-DD format

**Returns:** Promise<Array>

**Example:**
```javascript
import { getBillsByDate } from '../services/firestoreService';

const bills = await getBillsByDate('2024-02-15');
console.log(`Bills for 2024-02-15: ${bills.length}`);
```

---

### Bookings Collection

#### createBooking(bookingData)
Create a booking (when bill is approved).

**Parameters:**
- `bookingData` (object):
  ```javascript
  {
    date: string (YYYY-MM-DD),
    billId: string,
    customerName: string
  }
  ```

**Returns:** Promise<string> (Booking ID)

**Example:**
```javascript
import { createBooking } from '../services/firestoreService';

const bookingId = await createBooking({
  date: '2024-02-15',
  billId: 'bill123',
  customerName: 'राज कुमार'
});
console.log('Booking created:', bookingId);
```

---

#### isDateBooked(date)
Check if date is already booked.

**Parameters:**
- `date` (string) - Date in YYYY-MM-DD format

**Returns:** Promise<boolean>

**Example:**
```javascript
import { isDateBooked } from '../services/firestoreService';

const booked = await isDateBooked('2024-02-15');
if (booked) {
  console.log('Date is already booked');
} else {
  console.log('Date is available');
}
```

---

#### getAllBookings()
Get all bookings (sorted by date).

**Returns:** Promise<Array>

**Example:**
```javascript
import { getAllBookings } from '../services/firestoreService';

const bookings = await getAllBookings();
bookings.forEach(booking => {
  console.log(`${booking.date}: ${booking.customerName}`);
});
```

---

#### getBookingsByDateRange(startDate, endDate)
Get bookings within date range.

**Parameters:**
- `startDate` (string) - Start date (YYYY-MM-DD)
- `endDate` (string) - End date (YYYY-MM-DD)

**Returns:** Promise<Array>

**Example:**
```javascript
import { getBookingsByDateRange } from '../services/firestoreService';

const bookings = await getBookingsByDateRange('2024-02-01', '2024-02-29');
console.log(`Bookings in February: ${bookings.length}`);
```

---

## Usage Examples

### Complete Bill Creation Flow

```javascript
import { getItems, createBill, isDateBooked } from '../services/firestoreService';

async function submitBill() {
  try {
    // 1. Check if date is available
    const booked = await isDateBooked('2024-02-15');
    if (booked) {
      alert('Date is already booked');
      return;
    }

    // 2. Get items
    const items = await getItems();

    // 3. Create bill
    const billId = await createBill({
      customerName: 'राज कुमार',
      date: '2024-02-15',
      items: [
        { 
          id: items[0].id, 
          name: items[0].name, 
          quantity: 2, 
          rate: items[0].rate 
        }
      ],
      total: items[0].rate * 2
    });

    console.log('Bill created:', billId);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

---

### Complete Approval Flow

```javascript
import { 
  getBillById, 
  updateBillStatus, 
  createBooking 
} from '../services/firestoreService';

async function approveBill(billId) {
  try {
    // 1. Get bill details
    const bill = await getBillById(billId);
    if (!bill) {
      alert('Bill not found');
      return;
    }

    // 2. Update bill status
    await updateBillStatus(billId, 'approved');

    // 3. Create booking
    await createBooking({
      date: bill.date,
      billId: billId,
      customerName: bill.customerName
    });

    console.log('Bill approved and booking created');
  } catch (error) {
    console.error('Error:', error);
  }
}
```

---

### Dashboard Stats

```javascript
import { getAllBills, getAllBookings } from '../services/firestoreService';

async function getDashboardStats() {
  try {
    const bills = await getAllBills();
    const bookings = await getAllBookings();

    const stats = {
      totalBills: bills.length,
      pendingBills: bills.filter(b => b.status === 'pending').length,
      approvedBills: bills.filter(b => b.status === 'approved').length,
      totalBookings: bookings.length,
      todayBookings: bookings.filter(b => b.date === getTodayDate()).length
    };

    return stats;
  } catch (error) {
    console.error('Error:', error);
  }
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}
```

---

## Error Handling

All functions throw errors that should be caught:

```javascript
try {
  const items = await getItems();
} catch (error) {
  console.error('Failed to fetch items:', error.message);
  // Handle error - show user message, etc.
}
```

---

## Data Types

### Bill Object
```javascript
{
  id: string,
  customerName: string,
  date: string (YYYY-MM-DD),
  items: [
    {
      id: string,
      name: string,
      quantity: number,
      rate: number
    }
  ],
  total: number,
  status: 'pending' | 'approved' | 'rejected',
  createdAt: Timestamp
}
```

### Item Object
```javascript
{
  id: string,
  name: string,
  rate: number
}
```

### Booking Object
```javascript
{
  id: string,
  date: string (YYYY-MM-DD),
  billId: string,
  customerName: string
}
```

### User Object
```javascript
{
  uid: string,
  email: string,
  emailVerified: boolean,
  // ... other Firebase user properties
}
```

---

## Best Practices

1. **Always use try-catch** when calling async functions
2. **Check for null** before using returned objects
3. **Use date format** YYYY-MM-DD consistently
4. **Unsubscribe** from auth state listener in cleanup
5. **Handle loading states** while fetching data
6. **Show error messages** to users
7. **Validate data** before creating/updating

---

## Common Patterns

### React Hook Pattern
```javascript
import { useEffect, useState } from 'react';
import { getAllBills } from '../services/firestoreService';

function BillsList() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBills = async () => {
      try {
        setLoading(true);
        const data = await getAllBills();
        setBills(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {bills.map(bill => (
        <div key={bill.id}>{bill.customerName}</div>
      ))}
    </div>
  );
}
```

---

This API reference covers all available functions and their usage patterns.
