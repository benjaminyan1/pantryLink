const express = require('express');
const { auth: oidcAuth } = require('express-openid-connect');
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cors = require('cors');
const fetch = require('node-fetch'); // Ensure you have node-fetch@2 installed
const { auth: jwtAuth, requiredScopes } = require('express-oauth2-jwt-bearer');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware: parse request bodies and enable CORS
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// ----- Web Authentication using express-openid-connect -----
// This is used for your session-based routes (e.g., / and /profile)
const authConfig = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH0_SECRET,
  baseURL: process.env.AUTH0_BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL
};

app.use(oidcAuth(authConfig));

// ----- API Protection using express-oauth2-jwt-bearer -----
// These middlewares protect your API endpoints that expect a bearer token.
const checkJwt = jwtAuth({
  audience: process.env.AUTH0_AUDIENCE, // Your API Identifier (e.g., "https://myapi.example.com")
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL
});

const checkScopes = requiredScopes('read:messages');

// ----- MongoDB Connection -----
let db;

async function connectToDatabase() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB');
    db = client.db();
    return db;
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
    process.exit(1);
  }
}

// ----- Helper Middleware for Web Routes -----
// This middleware uses express-openid-connect to check if a user is authenticated.
function requiresAuth() {
  return (req, res, next) => {
    if (!req.oidc.isAuthenticated()) {
      return res.status(401).send('Authentication required');
    }
    next();
  };
}

// ----- Helper to Get Auth0 Management API Token -----
// This function uses node-fetch to get a management token from Auth0.
const getManagementToken = async () => {
  const response = await fetch(`${process.env.AUTH0_ISSUER_BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: process.env.AUTH0_CLIENT_ID,
      client_secret: process.env.AUTH0_CLIENT_SECRET,
      audience: `${process.env.AUTH0_ISSUER_BASE_URL}/api/v2/`
    })
  });

  const data = await response.json();

  if (response.status !== 200) {
    console.error('Failed to get management token:', data);
    console.error(response);
    throw new Error('Failed to get Auth0 management token');
  }

  return data.access_token;
};

// ----- Web Routes (using express-openid-connect) -----
app.get('/', (req, res) => {
  res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
});

app.get('/profile', requiresAuth(), async (req, res) => {
  const user = req.oidc.user;
  const usersCollection = db.collection('users');
  let dbUser = await usersCollection.findOne({ email: user.email });

  if (!dbUser) {
    const newUser = {
      email: user.email,
      name: user.name,
      auth0Id: user.sub,
      createdAt: new Date(),
      userType: user.userType || 'donor'
    };

    await usersCollection.insertOne(newUser);
    dbUser = newUser;
  }

  res.json(dbUser);
});

// ----- API Endpoints for Registration, Login, and Signup -----
// Registration endpoint (called after Auth0 signup to store additional user info)
app.post('/api/register', async (req, res) => {
  try {
    const { email, userType } = req.body;

    if (!email || !userType) {
      return res.status(400).json({ error: 'Email and userType are required' });
    }

    const usersCollection = db.collection('users');

    await usersCollection.updateOne(
      { email },
      { $set: { userType, updatedAt: new Date() } },
      { upsert: true }
    );

    res.status(200).json({ message: 'User type saved successfully' });
  } catch (error) {
    console.error('Error saving user type', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const tokenResponse = await fetch(`${process.env.AUTH0_ISSUER_BASE_URL}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'password',
        username: email,
        password,
        audience: process.env.AUTH0_AUDIENCE,
        scope: 'openid profile email',
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET
      })
    });

    const tokenData = await tokenResponse.json();

    if (tokenResponse.status !== 200) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userInfoResponse = await fetch(`${process.env.AUTH0_ISSUER_BASE_URL}/userinfo`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    const userInfo = await userInfoResponse.json();
    const usersCollection = db.collection('users');
    let dbUser = await usersCollection.findOne({ email: userInfo.email });

    if (!dbUser) {
      const newUser = {
        email: userInfo.email,
        name: userInfo.name,
        auth0Id: userInfo.sub,
        createdAt: new Date(),
        userType: userInfo.userType || 'donor'
      };

      await usersCollection.insertOne(newUser);
      dbUser = newUser;
    }

    res.json({ tokens: tokenData, user: dbUser });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Signup endpoint that creates a new user in Auth0 via the Management API
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Get management token
    const managementToken = await getManagementToken();

    // Create the user in Auth0
    const createUserResponse = await fetch(`${process.env.AUTH0_ISSUER_BASE_URL}/api/v2/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${managementToken}`
      },
      body: JSON.stringify({
        email,
        name,
        password,
        connection: 'Username-Password-Authentication',
        user_metadata: { phone }
      })
    });

    const userData = await createUserResponse.json();

    if (createUserResponse.status !== 201) {
      console.error('Failed to create Auth0 user', userData);
      return res.status(400).json({ error: userData.message || 'Failed to create user' });
    }

    const usersCollection = db.collection('users');
    await usersCollection.insertOne({
      email,
      name,
      phone,
      auth0Id: userData.user_id,
      userType: 'donor',
      createdAt: new Date()
    });

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ----- Protected API Endpoints (using express-oauth2-jwt-bearer) -----
// Public endpoint (no authentication needed)
app.get('/api/public', (req, res) => {
  res.json({
    message: "Hello from a public endpoint! You don't need to be authenticated to see this."
  });
});

// Private endpoint (requires a valid JWT in the Authorization header)
app.get('/api/private', checkJwt, (req, res) => {
  res.json({
    message: "Hello from a private endpoint! You need to be authenticated to see this."
  });
});

// Private endpoint with required scope 'read:messages'
app.get('/api/private-scoped', checkJwt, checkScopes, (req, res) => {
  res.json({
    message: "Hello from a private endpoint! You need to be authenticated and have a scope of read:messages to see this."
  });
});

// ----- Start the Server After Connecting to MongoDB -----
connectToDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch(console.error);
