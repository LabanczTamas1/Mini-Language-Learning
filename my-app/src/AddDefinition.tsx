import React from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

interface AddDefinitionProps {
  languageId: string; // Receive the selected languageId as a prop
}

const AddDefinition: React.FC<AddDefinitionProps> = ({ languageId }) => {
  return (
    <div style={{ padding: '20px' }}>
      <h2>Add a Definition for Language {languageId}</h2>
      <TextField label="Word" variant="filled" fullWidth margin="normal" />
      <TextField label="Definition" variant="filled" fullWidth margin="normal" multiline rows={4} />
      <Button variant="contained" color="primary" fullWidth>
        Add Definition
      </Button>
    </div>
  );
};

export default AddDefinition;
