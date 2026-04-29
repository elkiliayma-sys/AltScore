import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import BorrowerPortal from './BorrowerPortal';
import LenderPortal from './LenderPortal';

const path = window.location.pathname;

const root = ReactDOM.createRoot(document.getElementById('root'));

if (path === '/borrower') {
  root.render(<BorrowerPortal />);
} else if (path === '/lender') {
  root.render(<LenderPortal />);
} else {
  root.render(<App />);
}