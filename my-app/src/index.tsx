import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Login from './Login';
import reportWebVitals from './reportWebVitals';
import WebSocketComponent from './WebSocketComponent'; // Import the WebSocketComponent

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

const userId = localStorage.getItem('userId');

root.render(
  <React.StrictMode>
    <App />
    <WebSocketComponent userId={userId} />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
