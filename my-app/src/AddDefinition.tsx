import React, { useState, FormEvent } from 'react'; // Closing parenthesis added
import axios, { AxiosError } from 'axios';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

const AddDefinition = () => {
  return (
    <div>
      <h2>Add a definition</h2>
      <TextField id="filled-basic" label="Filled" variant="filled" />
      <TextField id="filled-basic" label="Filled" variant="filled" />
      <Button variant="contained">Add definition</Button>
    </div>
  );
};

export default AddDefinition;

