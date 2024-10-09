import React, { useState, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import axios from 'axios';
import { Alert, CircularProgress } from '@mui/material';

interface Definition {
    word: string;
    definitionId: string;
    definition: string;
    reminderStatus3Seconds: string;  // Reminder status for 3 seconds
    reminderStatus1Minute: string;    // Reminder status for 1 minute
    reminderStatus5Minutes: string;    // Reminder status for 5 minutes
    reminderStatus5Hours: string;      // Reminder status for 5 hours
}

interface AddDefinitionProps {
    languageId: string;
    userId: string;  // User ID passed as a prop
}

const AddDefinition: React.FC<AddDefinitionProps> = ({ languageId, userId }) => {
    const [word, setWord] = useState<string>('');
    const [definition, setDefinition] = useState<string>('');
    const [definitions, setDefinitions] = useState<Definition[]>([]);
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
                {
                    word,
                    definition,
                    reminderStatus3Seconds: 'In progress', // Include initial reminder statuses
                    reminderStatus1Minute: 'In progress',
                    reminderStatus5Minutes: 'In progress',
                    reminderStatus5Hours: 'In progress',
                },
                { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
            );
    
            if (response.status === 201) {
                const newDefinition: Definition = {
                    definitionId: response.data.definitionId, // Use the definitionId from the response
                    word,
                    definition,
                    reminderStatus3Seconds: 'In progress', // Initialize with default status
                    reminderStatus1Minute: 'In progress',
                    reminderStatus5Minutes: 'In progress',
                    reminderStatus5Hours: 'In progress'
                };
                setDefinitions((prevDefinitions) => [...prevDefinitions, newDefinition]);
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
                variant="outlined"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                style={{ marginBottom: '10px', width: '300px' }}
            />
            <TextField
                label="Definition"
                variant="outlined"
                value={definition}
                onChange={(e) => setDefinition(e.target.value)}
                style={{ marginBottom: '10px', width: '300px' }}
            />
            <Button variant="contained" color="primary" onClick={handleAddDefinition}>
                Add Definition
            </Button>

            {loading ? (
                <CircularProgress style={{ marginTop: '20px' }} />
            ) : (
                <div style={{ marginTop: '20px' }}>
                    <h3>Existing Definitions:</h3>
                    {definitions.length > 0 ? (
                        <ul>
                            {definitions.map((def) => (
                                <li key={def.definitionId}>
                                    <strong>{def.word}</strong>: {def.definition} <br />
                                    3 Seconds: {def.reminderStatus3Seconds} <br />
                                    1 Minute: {def.reminderStatus1Minute} <br />
                                    5 Minutes: {def.reminderStatus5Minutes} <br />
                                    5 Hours: {def.reminderStatus5Hours} <br />
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No definitions found.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default AddDefinition;
