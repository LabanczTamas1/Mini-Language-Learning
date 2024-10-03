const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const redis = require('redis');
const cors = require('cors');
require('dotenv').config(); // For loading environment variables

// Initialize Express app first
const app = express();

// Use CORS middleware
app.use(cors({
    origin: 'http://localhost:3001'  // Allow requests from this origin
}));

// Body parser middleware
app.use(bodyParser.json());

// Create Redis Client
const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379' // Use environment variable or default to localhost
});

client.on('error', (err) => {
    console.error('Redis Client Error', err);
});

client.on('connect', () => {
    console.log('Redis client connected successfully');
});

// Connect to Redis
(async () => {
    try {
        await client.connect();
        console.log('Connected to Redis');
    } catch (err) {
        console.error('Redis connection error', err);
    }
})();

// Create a new user
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required.' });
    }

    const userId = new Date().getTime(); // Simplified user ID (use a better approach in production)
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        await client.hSet(`user:${userId}`, {
            username,
            email,
            password_hash: hashedPassword,
        });
        res.status(201).send({ userId, username, email });
    } catch (error) {
        console.error('Error registering user:', error); // Log the error for debugging
        res.status(500).json({ error: 'Failed to register user.' });
    }
});


// Add a language
app.post('/languages/:userId', async (req, res) => {
    const { userId } = req.params;
    const { languageId, learningLanguage, translationLanguage } = req.body;

    if (!learningLanguage || !translationLanguage) {
        return res.status(400).json({ error: 'Learning and translation languages are required.' });
    }

    try {
        console.log('Attempting to add language in Redis...');
        
        const langIdStr = String(languageId);

        // Check if the key `languages:${userId}` exists and ensure it is a hash
        const keyType = await client.type(`languages:${userId}`);
        
        // If the key is not a hash, delete it
        if (keyType !== 'none' && keyType !== 'hash') {
            console.log(`Key ${`languages:${userId}`} exists with type ${keyType}, deleting it...`);
            await client.del(`languages:${userId}`);
        }

        // Add language details to hash
        await client.hSet(`languages:${userId}`,
            `language_pair:${langIdStr}:learning_language`, learningLanguage,
            `language_pair:${langIdStr}:translation_language`, translationLanguage
        );

        // Add languageId to the set for this user
        const setKey = `language_ids:${userId}`;
        const setType = await client.type(setKey);

        // Ensure the set exists correctly, delete if it's not a set
        if (setType !== 'none' && setType !== 'set') {
            console.log(`Key ${setKey} exists with type ${setType}, deleting it...`);
            await client.del(setKey);
        }

        await client.sAdd(setKey, langIdStr); // Add languageId to the set

        console.log('Language added successfully.');
        res.status(200).send({ message: 'Language added' });
    } catch (error) {
        console.error('Redis Error:', error);
        res.status(500).json({ error: 'Failed to add language.' });
    }
});




// Add a new word/definition
app.post('/definitions/:userId/:languageId', async (req, res) => {
    const { userId, languageId } = req.params;
    const { definitionId, word, translation } = req.body;

    if (!word || !translation) {
        return res.status(400).json({ error: 'Word and translation are required.' });
    }

    const timestamp = new Date().toISOString();

    try {
        await client.hSet(`definitions:${userId}:${languageId}:${definitionId}`, {
            word,
            translation,
            time_added: timestamp,
            status: 'learning',
        });
        await client.sAdd(`learning_state:${userId}:${languageId}:learning`, definitionId);
        res.status(200).send({ message: 'Definition added' });
    } catch (error) {
        console.error('Error adding definition:', error); // Log the error
        res.status(500).json({ error: 'Failed to add definition.' });
    }
});

// Set reminder for a word
app.post('/reminders/:userId/:definitionId', async (req, res) => {
    const { userId, definitionId } = req.params;
    const { reminderTime } = req.body; // Expecting a timestamp

    if (!reminderTime) {
        return res.status(400).json({ error: 'Reminder time is required.' });
    }

    try {
        await client.zAdd(`progress:${userId}`, {
            score: reminderTime,
            value: definitionId
        });
        await client.hSet(`reminders:${userId}:${definitionId}`, {
            reminder_time: reminderTime,
            reminder_status: 'active',
        });
        res.status(200).send({ message: 'Reminder set' });
    } catch (error) {
        console.error('Error setting reminder:', error); // Log the error
        res.status(500).json({ error: 'Failed to set reminder.' });
    }
});

// Update learning state (move a word to learned or missed)
app.put('/learning_state/:userId/:languageId/:definitionId', async (req, res) => {
    const { userId, languageId, definitionId } = req.params;
    const { newStatus } = req.body; // Expecting "learned" or "missed"

    if (!newStatus || (newStatus !== 'learned' && newStatus !== 'missed')) {
        return res.status(400).json({ error: 'New status must be "learned" or "missed".' });
    }

    try {
        // Remove from learning
        await client.sRem(`learning_state:${userId}:${languageId}:learning`, definitionId);

        // Add to new state
        if (newStatus === 'learned') {
            await client.sAdd(`learning_state:${userId}:${languageId}:learned`, definitionId);
        } else if (newStatus === 'missed') {
            await client.sAdd(`learning_state:${userId}:${languageId}:missed`, definitionId);
        }

        res.status(200).send({ message: `Definition marked as ${newStatus}` });
    } catch (error) {
        console.error('Error updating learning state:', error); // Log the error
        res.status(500).json({ error: 'Failed to update learning state.' });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
