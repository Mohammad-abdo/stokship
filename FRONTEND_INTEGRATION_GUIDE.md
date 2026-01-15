# Frontend Integration Guide - Mediation Platform

## Overview

This guide helps you integrate the frontend with the new mediation platform API endpoints.

---

## 🔄 Migration Steps

### 1. Update API Client

Replace old API calls with the new mediation API:

**Old (E-commerce):**
```javascript
import api from './lib/api';

// Get products
api.get('/api/products');

// Add to cart
api.post('/api/cart/items', { productId, quantity });

// Checkout
api.post('/api/checkout/init', { cartId });
```

**New (Mediation):**
```javascript
import { offerApi, dealApi, negotiationApi } from './lib/mediationApi';

// Get offers
offerApi.getActiveOffers();

// Request negotiation
dealApi.requestNegotiation(offerId, { notes: 'Interested' });

// Send message
negotiationApi.sendMessage(dealId, { message: 'Hello' });
```

### 2. Update Authentication

The auth controller now supports Employee, Trader, and Client roles:

```javascript
// Login (automatically detects role)
const response = await api.post('/api/auth/login', {
  email: 'user@example.com',
  password: 'password123'
});

// Response includes userType
const { user, token, userType } = response.data;
// userType can be: CLIENT, TRADER, EMPLOYEE, ADMIN, USER, VENDOR
```

### 3. Update Components

#### Remove Cart Components
- ❌ `CartPage.jsx`
- ❌ `CheckoutPage.jsx`
- ❌ Cart-related UI components

#### Add Mediation Components
- ✅ `OffersPage.jsx` - Browse active offers
- ✅ `OfferDetailPage.jsx` - View offer details
- ✅ `DealPage.jsx` - Deal management
- ✅ `NegotiationChat.jsx` - Real-time messaging
- ✅ `EmployeeDashboard.jsx` - Employee dashboard
- ✅ `TraderDashboard.jsx` - Trader dashboard

---

## 📝 Component Examples

### Offers Page

```jsx
import { useState, useEffect } from 'react';
import { offerApi } from '../lib/mediationApi';

function OffersPage() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    try {
      const response = await offerApi.getActiveOffers({
        page: 1,
        limit: 20
      });
      setOffers(response.data.data);
    } catch (error) {
      console.error('Error loading offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestNegotiation = async (offerId) => {
    try {
      await dealApi.requestNegotiation(offerId, {
        notes: 'Interested in this offer'
      });
      // Navigate to deal page
    } catch (error) {
      console.error('Error requesting negotiation:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Active Offers</h1>
      {offers.map(offer => (
        <div key={offer.id}>
          <h3>{offer.title}</h3>
          <p>{offer.description}</p>
          <p>Total CBM: {offer.totalCBM}</p>
          <p>Total Cartons: {offer.totalCartons}</p>
          <button onClick={() => handleRequestNegotiation(offer.id)}>
            Request Negotiation
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Negotiation Chat

```jsx
import { useState, useEffect } from 'react';
import { negotiationApi } from '../lib/mediationApi';

function NegotiationChat({ dealId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    loadMessages();
    // Set up polling or WebSocket for real-time updates
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [dealId]);

  const loadMessages = async () => {
    try {
      const response = await negotiationApi.getMessages(dealId);
      setMessages(response.data.data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await negotiationApi.sendMessage(dealId, {
        message: newMessage,
        messageType: 'TEXT'
      });
      setNewMessage('');
      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="negotiation-chat">
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.clientId ? 'client' : 'trader'}`}>
            <p>{msg.message}</p>
            <span>{new Date(msg.createdAt).toLocaleString()}</span>
          </div>
        ))}
      </div>
      <div className="input-area">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
}
```

### Employee Dashboard

```jsx
import { useState, useEffect } from 'react';
import { employeeApi } from '../lib/mediationApi';

function EmployeeDashboard({ employeeId }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [employeeId]);

  const loadDashboard = async () => {
    try {
      const response = await employeeApi.getEmployeeDashboard(employeeId);
      setDashboard(response.data.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!dashboard) return <div>No data</div>;

  return (
    <div className="employee-dashboard">
      <h1>Employee Dashboard</h1>
      <div className="stats">
        <div className="stat-card">
          <h3>Traders</h3>
          <p>{dashboard.stats.traderCount}</p>
        </div>
        <div className="stat-card">
          <h3>Active Deals</h3>
          <p>{dashboard.stats.activeDealsCount}</p>
        </div>
        <div className="stat-card">
          <h3>Total Commission</h3>
          <p>${dashboard.stats.totalCommission}</p>
        </div>
      </div>
      <div className="recent-deals">
        <h2>Recent Deals</h2>
        {dashboard.recentDeals.map(deal => (
          <div key={deal.id}>
            <p>{deal.dealNumber}</p>
            <p>Trader: {deal.trader.companyName}</p>
            <p>Client: {deal.client.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Excel Upload Component

```jsx
import { useState } from 'react';
import { offerApi } from '../lib/mediationApi';

function ExcelUpload({ offerId, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file');
      return;
    }

    setUploading(true);
    try {
      await offerApi.uploadOfferExcel(offerId, file);
      alert('File uploaded successfully!');
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="excel-upload">
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileChange}
      />
      <button onClick={handleUpload} disabled={uploading || !file}>
        {uploading ? 'Uploading...' : 'Upload Excel'}
      </button>
    </div>
  );
}
```

---

## 🔐 Role-Based Routing

Update your routing to handle new roles:

```jsx
import { ProtectedRoute } from './components/ProtectedRoute';

// In your routes file
<Route
  path="/employee/dashboard"
  element={
    <ProtectedRoute allowedRoles={['EMPLOYEE', 'ADMIN']}>
      <EmployeeDashboard />
    </ProtectedRoute>
  }
/>

<Route
  path="/trader/offers"
  element={
    <ProtectedRoute allowedRoles={['TRADER']}>
      <TraderOffersPage />
    </ProtectedRoute>
  }
/>

<Route
  path="/client/deals"
  element={
    <ProtectedRoute allowedRoles={['CLIENT']}>
      <ClientDealsPage />
    </ProtectedRoute>
  }
/>
```

---

## 📊 State Management

Update your context/state management:

```jsx
// AuthContext.jsx
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);

  const login = async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    const { user, token, userType } = response.data.data;
    
    setUser(user);
    setUserType(userType);
    localStorage.setItem('token', token);
    
    return { user, userType };
  };

  const isEmployee = () => userType === 'EMPLOYEE';
  const isTrader = () => userType === 'TRADER';
  const isClient = () => userType === 'CLIENT';
  const isAdmin = () => userType === 'ADMIN';

  return (
    <AuthContext.Provider value={{
      user,
      userType,
      login,
      isEmployee,
      isTrader,
      isClient,
      isAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
}
```

---

## 🎨 UI Updates

### Remove
- ❌ Shopping cart icon
- ❌ Checkout button
- ❌ Product pricing display
- ❌ Add to cart buttons
- ❌ Wishlist features

### Add
- ✅ "Request Negotiation" button on offers
- ✅ Deal status badges
- ✅ Negotiation chat interface
- ✅ Excel upload button
- ✅ Employee validation UI
- ✅ Commission display

---

## 📱 Example Page Structure

```
pages/
├── mediation/
│   ├── OffersPage.jsx          # Browse offers (public)
│   ├── OfferDetailPage.jsx     # View offer details
│   ├── DealPage.jsx            # Deal management
│   ├── NegotiationPage.jsx     # Negotiation chat
│   ├── employee/
│   │   ├── EmployeeDashboard.jsx
│   │   ├── EmployeeTraders.jsx
│   │   ├── EmployeeDeals.jsx
│   │   └── OfferValidation.jsx
│   ├── trader/
│   │   ├── TraderDashboard.jsx
│   │   ├── TraderOffers.jsx
│   │   ├── CreateOffer.jsx
│   │   └── TraderDeals.jsx
│   └── client/
│       ├── ClientDeals.jsx
│       └── ClientPayments.jsx
```

---

## ✅ Checklist

- [ ] Update API client (`mediationApi.js`)
- [ ] Update authentication flow
- [ ] Remove cart/checkout components
- [ ] Add offer browsing
- [ ] Add negotiation chat
- [ ] Add employee dashboard
- [ ] Add trader dashboard
- [ ] Add Excel upload
- [ ] Update routing
- [ ] Update state management
- [ ] Test all workflows

---

**Last Updated:** 2024




