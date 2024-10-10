import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';

interface RegisterProps {
  onRegisterSuccess: (userId: string) => void;
}

const Register: React.FC<RegisterProps> = ({ onRegisterSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('http://localhost:3000/register', {
        email,
        password,
      });

      // Assuming the response contains the userId
      const { userId } = response.data;
      onRegisterSuccess(userId);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Registration failed.');
    }
  };

  return (
    <div className="login-container"> {/* Use the same container class */}
      <div className="login-card"> {/* Use the same card class */}
        <h2>Register</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input" // Same input styling
            />
          </div>
          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input" // Same input styling
            />
          </div>
          <button type="submit" className="btn-primary">Register</button> {/* Same button styling */}
        </form>
      </div>
    </div>
  );
};

export default Register;
