import React, { useState, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import axios from 'axios';
import { Alert, CircularProgress } from '@mui/material';

interface AddDefinitionProps {
  languageId: string;
  userId: string;  // User ID passed as a prop
}

const AddDefinition: React.FC<AddDefinitionProps> = ({ languageId, userId }) => {
  const [word, setWord] = useState<string>('');
  const [definition, setDefinition] = useState<string>('');
  const [definitions, setDefinitions] = useState<{ word: string; definition: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch definitions when the component loads
  useEffect(() => {
    const fetchDefinitions = async () => {
      setLoading(true);
      setErrorMessage(null); // Clear previous error message

      try {
        const response = await axios.get(
          `http://localhost:3000/languages/${userId}/${languageId}/definitions`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
          }
        );
        setDefinitions(response.data);
      } catch (error) {
        setErrorMessage('Error fetching definitions. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDefinitions();
  }, [languageId, userId]);

  const handleAddDefinition = async () => {
    if (!word || !definition) {
      alert('Please provide both a word and a definition.');
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:3000/languages/${userId}/${languageId}/definitions`,
        { word, definition },
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );

      if (response.status === 201) {
        // Add the new definition to the local state
        setDefinitions((prevDefinitions) => [...prevDefinitions, { word, definition }]);
        setWord('');  // Clear the input fields
        setDefinition('');
      }
    } catch (error) {
      setErrorMessage('Error adding definition. Please try again.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Add a Definition for Language {languageId}</h2>

      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

      <TextField
        label="Word"
        variant="filled"
        fullWidth
        margin="normal"
        value={word}
        onChange={(e) => setWord(e.target.value)}
      />
      <TextField
        label="Definition"
        variant="filled"
        fullWidth
        margin="normal"
        multiline
        rows={4}
        value={definition}
        onChange={(e) => setDefinition(e.target.value)}
      />
      <Button variant="contained" color="primary" fullWidth onClick={handleAddDefinition}>
        Add Definition
      </Button>

      <h3>Definitions for this language</h3>

      {loading ? (
        <CircularProgress />
      ) : definitions.length > 0 ? (
        <ul>
          {definitions.map((def, index) => (
            <li key={index}>
              <strong>{def.word}</strong>: {def.definition}
            </li>
          ))}
        </ul>
      ) : (
        <p>No definitions yet.</p>
      )}
    </div>
  );
};

export default AddDefinition;
