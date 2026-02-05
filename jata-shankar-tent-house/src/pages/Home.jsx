import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '12px',
        textAlign: 'center',
        maxWidth: '500px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
      }}>
        <h1 style={{ fontSize: '32px', marginBottom: '8px', color: '#333' }}>
          Jata Shankar Tent House
        </h1>
        <h2 style={{ fontSize: '20px', color: '#666', marginBottom: '8px' }}>
          Billing & Booking System
        </h2>
        <p style={{ color: '#999', marginBottom: '30px', fontSize: '14px' }}>
          Manage tent rentals with ease
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
          <button 
            onClick={() => navigate('/new-bill')}
            style={{
              padding: '14px 28px',
              fontSize: '16px',
              width: '100%',
              maxWidth: '300px',
              margin: '0 auto',
              background: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Create New Bill
          </button>
          <button 
            onClick={() => navigate('/login')}
            style={{
              padding: '14px 28px',
              fontSize: '16px',
              width: '100%',
              maxWidth: '300px',
              margin: '0 auto',
              background: '#757575',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Owner Login
          </button>
        </div>

        <div style={{
          textAlign: 'left',
          background: '#f5f5f5',
          padding: '20px',
          borderRadius: '8px'
        }}>
          <h3 style={{ marginBottom: '12px', fontSize: '14px' }}>How it works:</h3>
          <ol style={{ marginLeft: '20px', fontSize: '13px', lineHeight: '1.8', color: '#666' }}>
            <li>Create a bill with customer details and items</li>
            <li>Submit for owner approval</li>
            <li>Owner reviews and confirms booking</li>
            <li>Booking is confirmed for the selected date</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
