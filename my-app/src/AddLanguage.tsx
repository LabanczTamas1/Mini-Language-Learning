import React, { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { Alert, Typography } from '@mui/material';

interface AddLanguageProps {
  userId: string;
  onLanguageClick: (languageId: string) => void; // Prop to handle when a language is clicked
}

interface LanguageData {
  languageId: string;
  learningLanguage: string;
  translationLanguage: string;
}

const AddLanguage: React.FC<AddLanguageProps> = ({ userId, onLanguageClick }) => {
  const [learningLanguage, setLearningLanguage] = useState<string>('');
  const [translationLanguage, setTranslationLanguage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [languages, setLanguages] = useState<LanguageData[]>([]);

  const fetchLanguages = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`http://localhost:3000/languages/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLanguages(response.data);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setErrorMessage('Failed to fetch languages. Please try again.');
      } else {
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    }
  };

  useEffect(() => {
    fetchLanguages();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');

    const languageData = {
      languageId: String(new Date().getTime()),
      learningLanguage,
      translationLanguage,
    };

    try {
      const token = localStorage.getItem('authToken');
      await axios.post(`http://localhost:3000/languages/${userId}`, languageData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert('Language added successfully');
      setLearningLanguage('');
      setTranslationLanguage('');
      setLanguages((prevLanguages) => [...prevLanguages, languageData]);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setErrorMessage('Failed to add language. Please try again.');
      } else {
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>Add Language</Typography>

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

      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

      <Typography variant="h6" gutterBottom>Your Languages:</Typography>
      {languages.length > 0 ? (
        <ul>
          {languages.map((language) => (
            <li key={language.languageId}>
              <Button
                variant="outlined"
                onClick={() => onLanguageClick(language.languageId)} // Call the parent prop to change view
              >
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
