const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const redis = require('redis');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid'); // For generating unique IDs
require('dotenv').config(); // Load environment variables

const app = express();

// Use CORS middleware
app.use(cors({
    origin: 'http://localhost:3001'  // Allow requests from this origin (your frontend)
}));

// Body parser middleware
app.use(bodyParser.json());

// JWT secret key (set in environment variables for security)
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Create Redis Client
const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6380' // Use environment variable or default to localhost
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

// ------------------ USER AUTHENTICATION ------------------ //

// User registration route
app.post('/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        // Check if user already exists
        const userExists = await client.hGet('users', email);
        if (userExists) {
            return res.status(400).json({ error: 'User already exists.' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate a unique user ID
        const userId = uuidv4();

        // Store user in Redis
        await client.hSet('users', email, JSON.stringify({ userId, hashedPassword }));

        // Respond with the user ID
        res.status(201).json({ userId });
    } catch (error) {
        console.error('Error registering user:', error.message);
        res.status(500).json({ error: 'Failed to register user.' });
    }
});

// User login route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        // Fetch user from Redis
        const userData = await client.hGet('users', email);
        if (!userData) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        const { userId, hashedPassword } = JSON.parse(userData);

        // Compare the provided password with the hashed password
        const passwordMatch = await bcrypt.compare(password, hashedPassword);
        if (!passwordMatch) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        // Generate a JWT token
        const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '1h' });

        // Respond with userId and token
        res.status(200).json({ userId, token });
    } catch (error) {
        console.error('Error logging in:', error.message);
        res.status(500).json({ error: 'Failed to log in.' });
    }
});

// Middleware to authenticate JWT tokens
function authenticate(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(401).json({ error: 'Access denied, no token provided.' });
    }

    try {
        const decoded = jwt.verify(token.split(' ')[1], JWT_SECRET);
        req.user = decoded; // Add the decoded user info to the request
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token.' });
    }
}

// ------------------ LANGUAGE ROUTES (PROTECTED) ------------------ //

// Add a language (protected route)
app.post('/languages/:userId', authenticate, async (req, res) => {
    const { userId } = req.params;
    const { languageId, learningLanguage, translationLanguage } = req.body;

    // Log to verify values received from the frontend
    console.log('Received learningLanguage:', learningLanguage);
    console.log('Received translationLanguage:', translationLanguage);

    // Validate that both languages are provided
    if (!learningLanguage || !translationLanguage) {
        return res.status(400).json({ error: 'Both learning and translation languages are required.' });
    }

    try {
        const langIdStr = String(languageId); // Convert languageId to string if it's not

        // Create a JSON object for the language pair
        const languageData = JSON.stringify({
            learningLanguage,
            translationLanguage
        });

        // Log the object you're about to save to Redis
        console.log('Saving to Redis:', languageData);

        // Store the JSON object in a single field in Redis
        await client.hSet(`languages:${userId}`, langIdStr, languageData);

        // Add the languageId to the set of language_ids for this user
        await client.sAdd(`language_ids:${userId}`, langIdStr);

        res.status(200).send({ message: 'Language pair added successfully' });
    } catch (error) {
        console.error('Error adding language pair:', error.message);
        res.status(500).json({ error: 'Failed to add language pair.' });
    }
});






// Fetch all languages for a specific user (protected route)
app.get('/languages/:userId', authenticate, async (req, res) => {
    const { userId } = req.params;

    try {
        // Fetch all language IDs for the user
        const languageIds = await client.sMembers(`language_ids:${userId}`);
        if (languageIds.length === 0) {
            return res.status(200).json([]); // Return an empty array if no languages exist
        }

        // Fetch all language pairs as JSON objects from Redis
        const languages = await Promise.all(languageIds.map(async (languageId) => {
            // Fetch the JSON string stored in Redis for this languageId
            const languageData = await client.hGet(`languages:${userId}`, languageId);

            // Log the fetched data
            console.log(`Fetched data for languageId: ${languageId} -> ${languageData}`);

            // Check if the data is valid before attempting to parse it
            if (!languageData) {
                console.error(`No data found for languageId: ${languageId}`);
                return {
                    languageId,
                    learningLanguage: null,
                    translationLanguage: null
                };
            }

            // Try to parse the JSON string
            let parsedData;
            try {
                parsedData = JSON.parse(languageData);
            } catch (error) {
                console.error(`Failed to parse JSON for languageId: ${languageId}`, error);
                return {
                    languageId,
                    learningLanguage: null,
                    translationLanguage: null
                };
            }

            const { learningLanguage, translationLanguage } = parsedData || {};

            return {
                languageId,
                learningLanguage: learningLanguage || null,
                translationLanguage: translationLanguage || null
            };
        }));

        res.status(200).json(languages);
    } catch (error) {
        console.error('Error fetching languages:', error.message);
        res.status(500).json({ error: 'Failed to fetch languages.' });
    }
});





// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
