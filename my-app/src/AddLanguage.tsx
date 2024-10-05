import React, { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { Alert, Typography } from '@mui/material';

interface AddLanguageProps {
  userId: string; // The userId is passed down as a prop
}

interface LanguageData {
  languageId: string;
  learningLanguage: string;
  translationLanguage: string;
}

const AddLanguage: React.FC<AddLanguageProps> = ({ userId }) => {
  const [learningLanguage, setLearningLanguage] = useState<string>('');
  const [translationLanguage, setTranslationLanguage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [languages, setLanguages] = useState<LanguageData[]>([]); // State to hold the list of languages

  // Fetch the list of languages associated with the user
  const fetchLanguages = async () => {
    try {
      const token = localStorage.getItem('authToken'); // Retrieve token from localStorage
      const response = await axios.get(`http://localhost:3000/languages/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`, // Pass token in Authorization header
        },
      });
      setLanguages(response.data); // Update the languages in the state
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error('Axios error:', error.response?.data || error.message);
        setErrorMessage('Failed to fetch languages. Please try again.');
      } else {
        console.error('Unexpected error:', error);
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    }
  };

  // Fetch languages when the component mounts
  useEffect(() => {
    fetchLanguages(); // Fetch languages specific to the logged-in user
  }, [userId]);

  // Handle form submission to add a new language
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(''); // Reset error message

    const languageData = {
      languageId: String(new Date().getTime()), // Create a unique language ID based on timestamp
      learningLanguage,
      translationLanguage,
    };

    try {
      const token = localStorage.getItem('authToken'); // Retrieve token from localStorage
      const response = await axios.post(`http://localhost:3000/languages/${userId}`, languageData, {
        headers: {
          Authorization: `Bearer ${token}`, // Pass token in Authorization header
        },
      });

      // Notify user and reset form inputs
      alert('Language added successfully');
      setLearningLanguage(''); // Clear input fields after successful addition
      setTranslationLanguage('');

      // Update the languages list after successfully adding a new language
      setLanguages((prevLanguages) => [...prevLanguages, languageData]);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error('Axios error:', error.response?.data || error.message);
        setErrorMessage('Failed to add language. Please try again.');
      } else {
        console.error('Unexpected error:', error);
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>
        Add Language
      </Typography>

      {/* Language form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <TextField
          label="Learning Language"
          variant="outlined"
          value={learningLanguage}
          onChange={(e) => setLearningLanguage(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Translation Language"
          variant="outlined"
          value={translationLanguage}
          onChange={(e) => setTranslationLanguage(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        <Button type="submit" variant="contained" color="primary" fullWidth>
          Add Language
        </Button>
      </form>

      {/* Error message display */}
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

      {/* Display list of languages */}
      <Typography variant="h6" gutterBottom>
        Your Languages:
      </Typography>
      {languages.length > 0 ? (
        <ul>
          {languages.map((language) => (
            <li key={language.languageId}>
              <Button variant="outlined">
                {language.learningLanguage} → {language.translationLanguage}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <Typography>No languages added yet.</Typography>
      )}
    </div>
  );
};

export default AddLanguage;
