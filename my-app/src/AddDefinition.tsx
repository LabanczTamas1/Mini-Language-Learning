import React, { useState, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import axios from 'axios';
import { Alert, CircularProgress, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import './AddDefinition.css';

interface Definition {
    word: string;
    definitionId: string;
    definition: string;
    reminderStatus3Seconds: string;
    reminderStatus1Minute: string;
    reminderStatus5Minutes: string;
    reminderStatus5Hours: string;
}

interface AddDefinitionProps {
    languageId: string;
    userId: string;
}

const AddDefinition: React.FC<AddDefinitionProps> = ({ languageId, userId }) => {
    const [word, setWord] = useState<string>('');
    const [definition, setDefinition] = useState<string>('');
    const [definitions, setDefinitions] = useState<Definition[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [editMode, setEditMode] = useState<boolean>(false);
    const [currentDefinitionId, setCurrentDefinitionId] = useState<string | null>(null);

    // Fetch definitions when the component loads
    useEffect(() => {
        const fetchDefinitions = async () => {
            setLoading(true);
            setErrorMessage(null);

            try {
                const response = await axios.get(
                    `http://localhost:3000/languages/${userId}/${languageId}/definitions`,
                    {
                        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
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
                    reminderStatus3Seconds: 'In progress',
                    reminderStatus1Minute: 'In progress',
                    reminderStatus5Minutes: 'In progress',
                    reminderStatus5Hours: 'In progress',
                },
                { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
            );

            if (response.status === 201) {
                const newDefinition: Definition = {
                    definitionId: response.data.definitionId,
                    word,
                    definition,
                    reminderStatus3Seconds: 'In progress',
                    reminderStatus1Minute: 'In progress',
                    reminderStatus5Minutes: 'In progress',
                    reminderStatus5Hours: 'In progress',
                };
                setDefinitions((prevDefinitions) => [...prevDefinitions, newDefinition]);
                setWord('');
                setDefinition('');
            }
        } catch (error) {
            setErrorMessage('Error adding definition. Please try again.');
        }
    };

    const handleDeleteDefinition = async (definitionId: string) => {
        try {
            await axios.delete(
                `http://localhost:3000/languages/${userId}/${languageId}/definitions/${definitionId}`,
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
                }
            );
            setDefinitions((prevDefinitions) =>
                prevDefinitions.filter((def) => def.definitionId !== definitionId)
            );
        } catch (error) {
            setErrorMessage('Error deleting definition. Please try again.');
        }
    };

    const handleEditDefinition = (def: Definition) => {
        setWord(def.word);
        setDefinition(def.definition);
        setCurrentDefinitionId(def.definitionId);
        setEditMode(true);
    };

    const handleUpdateDefinition = async () => {
        if (!word || !definition || !currentDefinitionId) {
            alert('Please provide both a word and a definition.');
            return;
        }
    
        try {
            await axios.put(
                `http://localhost:3000/languages/${userId}/${languageId}/definitions/${currentDefinitionId}`,
                { word, definition },
                { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
            );
    
            setDefinitions((prevDefinitions) =>
                prevDefinitions.map((def) =>
                    def.definitionId === currentDefinitionId
                        ? { ...def, word, definition }
                        : def
                )
            );
            setWord('');
            setDefinition('');
            setCurrentDefinitionId(null);
            setEditMode(false);
        } catch (error: any) {
            console.error('Error updating definition:', error.response || error.message);
            setErrorMessage('Error updating definition. Please try again.');
        }
    };

    // AddDefinition.tsx

// A többi kód változatlan marad...

    return (
    <div style={{ padding: '20px' }}>
        <h2>{editMode ? 'Edit Definition' : 'Add a Definition'} for Language {languageId}</h2>

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
        {editMode ? (
            <Button variant="contained" color="primary" onClick={handleUpdateDefinition}>
                Update Definition
            </Button>
        ) : (
            <Button variant="contained" color="primary" onClick={handleAddDefinition}>
                Add Definition
            </Button>
        )}

        {loading ? (
            <CircularProgress style={{ marginTop: '20px' }} />
        ) : (
            <div style={{ marginTop: '20px' }}>
                <h3>Existing Definitions:</h3>
                {definitions.length > 0 ? (
                    <table className="definitions-table">
                        <thead>
                            <tr>
                                <th>Word</th>
                                <th style={{ borderRight: '2px solid black' }}>Definition</th>
                                <th>3 Seconds</th>
                                <th>1 Minute</th>
                                <th>5 Minutes</th>
                                <th>5 Hours</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
    {definitions.map((def) => (
        <tr className="definition-row" key={def.definitionId}>
            <td>{def.word}</td>
            <td style={{ borderRight: '2px solid black' }}>{def.definition}</td>
            <td style={{ backgroundColor: def.reminderStatus3Seconds === 'In progress' ? '#ffeb3b' : def.reminderStatus3Seconds === 'Achieved' ? '#c8e6c9' : def.reminderStatus3Seconds === 'Failed' ? '#ffcccb' : 'transparent' }}>
                {def.reminderStatus3Seconds}
            </td>
            <td style={{ backgroundColor: def.reminderStatus1Minute === 'In progress' ? '#ffeb3b' : def.reminderStatus1Minute === 'Achieved' ? '#c8e6c9' : def.reminderStatus1Minute === 'Failed' ? '#ffcccb' : 'transparent' }}>
                {def.reminderStatus1Minute}
            </td>
            <td style={{ backgroundColor: def.reminderStatus5Minutes === 'In progress' ? '#ffeb3b' : def.reminderStatus5Minutes === 'Achieved' ? '#c8e6c9' : def.reminderStatus5Minutes === 'Failed' ? '#ffcccb' : 'transparent' }}>
                {def.reminderStatus5Minutes}
            </td>
            <td style={{ backgroundColor: def.reminderStatus5Hours === 'In progress' ? '#ffeb3b' : def.reminderStatus5Hours === 'Achieved' ? '#c8e6c9' : def.reminderStatus5Hours === 'Failed' ? '#ffcccb' : 'transparent' }}>
                {def.reminderStatus5Hours}
            </td>
            <td>
                <IconButton onClick={() => handleEditDefinition(def)} color="primary" aria-label="edit">
                    <EditIcon />
                </IconButton>
                <IconButton onClick={() => handleDeleteDefinition(def.definitionId)} color="secondary" aria-label="delete">
                    <DeleteIcon />
                </IconButton>
            </td>
        </tr>
    ))}
</tbody>


                    </table>
                ) : (
                    <p>No definitions found.</p>
                )}
            </div>
        )}
    </div>
);

};

export default AddDefinition;
