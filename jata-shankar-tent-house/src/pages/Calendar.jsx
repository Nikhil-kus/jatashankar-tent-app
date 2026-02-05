import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllBookings } from '../services/firestoreService';
import '../styles/pages.css';

export default function Calendar() {
  const [bookings, setBookings] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const bookingsData = await getAllBookings();
      setBookings(bookingsData);
    } catch (err) {
      setError('Failed to load bookings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Check if date is booked
  const isDateBooked = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return bookings.some(b => b.date === dateStr);
  };

  // Get booking for date
  const getBookingForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return bookings.find(b => b.date === dateStr);
  };

  // Generate calendar days
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
    }

    return days;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const calendarDays = generateCalendarDays();
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="calendar-container">
      <header className="page-header">
        <h1>Booking Calendar</h1>
        <button onClick={() => navigate('/dashboard')} className="btn-back">
          ← Dashboard
        </button>
      </header>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading bookings...</div>
      ) : (
        <div className="calendar-content">
          {/* Calendar */}
          <div className="calendar-card">
            <div className="calendar-header">
              <button onClick={handlePrevMonth} className="nav-btn">
                ← Prev
              </button>
              <h2>{monthName}</h2>
              <button onClick={handleNextMonth} className="nav-btn">
                Next →
              </button>
            </div>

            <div className="calendar-weekdays">
              <div className="weekday">Sun</div>
              <div className="weekday">Mon</div>
              <div className="weekday">Tue</div>
              <div className="weekday">Wed</div>
              <div className="weekday">Thu</div>
              <div className="weekday">Fri</div>
              <div className="weekday">Sat</div>
            </div>

            <div className="calendar-days">
              {calendarDays.map((day, idx) => {
                if (!day) {
                  return <div key={`empty-${idx}`} className="calendar-day empty"></div>;
                }

                const booked = isDateBooked(day);
                const booking = getBookingForDate(day);
                const isToday = day.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={day.toISOString()}
                    className={`calendar-day ${booked ? 'booked' : ''} ${isToday ? 'today' : ''}`}
                    title={booked ? `Booked: ${booking?.customerName}` : ''}
                  >
                    <div className="day-number">{day.getDate()}</div>
                    {booked && <div className="booked-indicator">●</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="calendar-legend">
            <div className="legend-item">
              <div className="legend-color today"></div>
              <span>Today</span>
            </div>
            <div className="legend-item">
              <div className="legend-color booked"></div>
              <span>Booked</span>
            </div>
          </div>

          {/* Bookings List */}
          {bookings.length > 0 && (
            <div className="bookings-list-section">
              <h2>All Bookings</h2>
              <div className="bookings-list">
                {bookings.map(booking => (
                  <div key={booking.id} className="booking-item">
                    <div className="booking-info">
                      <h4>{booking.customerName}</h4>
                      <p>Date: {booking.date}</p>
                    </div>
                    <button
                      onClick={() => navigate(`/bills?id=${booking.billId}`)}
                      className="btn-secondary"
                    >
                      View Bill
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
