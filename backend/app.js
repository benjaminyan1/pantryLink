const express = require('express');
const app =  express();
const { auth: oidcAuth } = require('express-openid-connect');
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cors = require('cors');
const fetch = require('node-fetch'); 
const { auth: jwtAuth, requiredScopes } = require('express-oauth2-jwt-bearer');
const mongoose = require('mongoose');
const nonprofit = require('./routes/nonprofitRoutes');
app.use(express.json());
app.use('/api/nonprofit', nonprofit);


dotenv.config();

const port = process.env.PORT || 3000;



app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());



const dasherRoutes = require('./routes/dasherRoutes');
const donorRoutes = require('./routes/donorRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const itemRoutes = require('./routes/itemRoutes');
const nonprofitRoutes = require('./routes/nonprofitRoutes');

app.use('/api', dasherRoutes);
app.use('/api', donorRoutes);
app.use('/api', deliveryRoutes);
app.use('/api', itemRoutes);
app.use('/api', nonprofitRoutes);





mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Mongoose connected'))
.catch(err => {
  console.error('Failed to connect with Mongoose', err);
  process.exit(1);
});

console.log("AUTH0_SECRET:", process.env.AUTH0_SECRET);


const authConfig = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH0_SECRET,
  baseURL: process.env.AUTH0_BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL
};

app.use(oidcAuth(authConfig));



const checkJwt = jwtAuth({
  audience: process.env.AUTH0_AUDIENCE, 
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL
});

const checkScopes = requiredScopes('read:messages');


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



function requiresAuth() {
  return (req, res, next) => {
    if (!req.oidc.isAuthenticated()) {
      return res.status(401).send('Authentication required');
    }
    next();
  };
}



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


app.post('/api/login', async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    
    const tokenResponse = await fetch(`${process.env.AUTH0_ISSUER_BASE_URL}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        audience: process.env.AUTH0_AUDIENCE
      })
    });

    const tokenData = await tokenResponse.json();
    
    if (tokenResponse.status !== 200) {
      console.error("Login error response:", tokenData);
      return res.status(401).json({ error: tokenData.error_description || 'Authentication failed' });
    }

    
    const usersCollection = db.collection('users');
    let dbUser = await usersCollection.findOne({ email });
    
    if (!dbUser) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    
    if (userType && dbUser.userType !== userType) {
      await usersCollection.updateOne(
        { email },
        { $set: { userType, updatedAt: new Date() } }
      );
      dbUser.userType = userType;
    }

    
    let userModel;
    let usersKevinMao;
    switch (dbUser.userType) {
      case 'donor':
        userModel = await require('./models/Donor').findOne({ email });
        usersKevinMao = db.collection('donors');
        const donorDbUser = await usersKevinMao.findOne({ email });
        if (donorDbUser) dbUser = donorDbUser;
        break;
      case 'nonprofit':
        userModel = await require('./models/Nonprofit').findOne({ 'contactPerson.email': email });
        usersKevinMao = db.collection('nonprofits');
        const nonprofitDbUser = await usersKevinMao.findOne({ email });
        if (nonprofitDbUser) dbUser = nonprofitDbUser;
        break;
      case 'dasher':
        userModel = await require('./models/Dasher').findOne({ email });
        usersKevinMao = db.collection('dashers');
        const dasherDbUser = await usersKevinMao.findOne({ email });
        if (dasherDbUser) dbUser = dasherDbUser;
        break;
    }

    
    
    const userId = userModel?._id || dbUser?._id || null;

    if (!userId) {
      return res.status(404).json({ error: 'User profile not found. Please complete registration.' });
    }

    res.json({ 
      tokens: { 
        access_token: tokenData.access_token,
        expires_in: tokenData.expires_in,
        token_type: tokenData.token_type
      }, 
      user: {
        ...dbUser,
        id: userId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, phone, userType, location, organizationName, address } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    
    const validTypes = ['donor', 'nonprofit', 'dasher'];
    if (!userType || !validTypes.includes(userType)) {
      return res.status(400).json({ error: 'Valid userType is required (donor, nonprofit, or dasher)' });
    }
    
    
    if (userType === 'nonprofit' && (!organizationName || !address)) {
      return res.status(400).json({ error: 'Organization name and address are required for nonprofit accounts' });
    }

    if (userType === 'dasher' && !location) {
      return res.status(400).json({ error: 'Location is required for dasher accounts' });
    }

    
    const managementToken = await getManagementToken();

    
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
        user_metadata: { 
          phone,
          userType
        }
      })
    });

    const userData = await createUserResponse.json();

    if (createUserResponse.status !== 201) {
      console.error('Failed to create Auth0 user', userData);
      return res.status(400).json({ error: userData.message || 'Failed to create user' });
    }

    const auth0Id = userData.user_id;
    
    
    const usersCollection = db.collection('users');
    await usersCollection.insertOne({
      email,
      name,
      phone,
      auth0Id,
      userType,
      createdAt: new Date()
    });
    
    
    let userDoc;
    
    switch(userType) {
      case 'donor': {
        const Donor = require('./models/Donor');
        userDoc = new Donor({
          auth0Id,
          name,
          email,
          phone,
          donations: []
        });
        await userDoc.save();
        break;
      }
      
      case 'nonprofit': {
        const Nonprofit = require('./models/Nonprofit');
        userDoc = new Nonprofit({
          auth0Id,
          organizationName: organizationName || name,
          contactPerson: {
            name,
            email,
            phone: phone || ''
          },
          address,
          needs: [],
          upcomingDeliveries: []
        });
        await userDoc.save();
        break;
      }
      
      case 'dasher': {
        const Dasher = require('./models/Dasher');
        userDoc = new Dasher({
          auth0Id,
          name,
          email,
          phone,
          location: location || {
            address: address || '',
            coordinates: [0, 0] 
          },
          vehicle: req.body.vehicle || {},
          isAvailable: true,
          deliveries: []
        });
        await userDoc.save();
        break;
      }
    }

    res.status(201).json({ 
      message: 'User created successfully',
      userType,
      userId: userDoc._id
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});



app.get('/api/public', (req, res) => {
  res.json({
    message: "Hello from a public endpoint! You don't need to be authenticated to see this."
  });
});


app.get('/api/private', checkJwt, (req, res) => {
  res.json({
    message: "Hello from a private endpoint! You need to be authenticated to see this."
  });
});


app.get('/api/private-scoped', checkJwt, checkScopes, (req, res) => {
  res.json({
    message: "Hello from a private endpoint! You need to be authenticated and have a scope of read:messages to see this."
  });
});


connectToDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch(console.error);
