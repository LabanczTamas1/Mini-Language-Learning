import React, { useState } from 'react';
import Register from './Register';
import Login from './Login';
import AddLanguage from './AddLanguage';

const App = () => {
  const [isLogin, setIsLogin] = useState<boolean>(true); // Toggle between login and register
  const [userId, setUserId] = useState<string | null>(null); // Stores the user ID after registration or login
  const [token, setToken] = useState<string | null>(null); // Stores token after login
  const [userEmail, setUserEmail] = useState<string | null>(null); // Stores user email after login

  // Handle successful registration (no token needed anymore)
  const handleRegisterSuccess = (id: string) => {
    setUserId(id);
  };

  // Handle successful login
  const handleLoginSuccess = (id: string, authToken: string, email: string) => {
    setUserId(id);
    setToken(authToken);
    setUserEmail(email); // Set the user email
    localStorage.setItem('authToken', authToken); // Optionally store token in localStorage
  };

  return (
    <div>
      <h1>Language Learning App</h1>

      {/* Check if user is not logged in */}
      {!userId ? (
        <div>
          <h2>{isLogin ? 'Login' : 'Register'} to Continue</h2>

          {/* Toggle between Login and Register components */}
          {isLogin ? (
            <Login onLoginSuccess={handleLoginSuccess} />
          ) : (
            <Register onRegisterSuccess={handleRegisterSuccess} />
          )}

          {/* Button to toggle between Login and Register */}
          <button onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Switch to Register' : 'Switch to Login'}
          </button>
        </div>
      ) : (
        <div>
          <h2>Welcome, {userEmail}!</h2>
          {/* Display AddLanguage component after login */}
          {token && userId && (
            <AddLanguage userId={userId} />
          )}
        </div>
      )}
    </div>
  );
};

export default App;
