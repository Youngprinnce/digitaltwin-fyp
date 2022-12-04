const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const socketioJwt = require('socketio-jwt');
require('dotenv').config();

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, { cors: { origin: '*' } });
const InitiateMongoServer = require('./db');
const User = require('./userModel');

// Initiate MongoDB
InitiateMongoServer();

io.use(socketioJwt.authorize({
  secret: 'helloworld',
  handshake: true,
  auth_header_required: true,
}));

let timeChange;
io.on('connection', async (socket) => {
  const { username } = socket.decoded_token;
  const valid = await User.findOne({ username });
  if (valid) {
    if (timeChange) clearInterval(timeChange);
    setInterval(() => socket.emit('message', (Math.random() * (0.5 - 0.1) + 0.1).toFixed(2)), 3000);

    setInterval(() => socket.emit('ph', (Math.floor(Math.random() * 14) + 1)), 6000);

    setInterval(() => socket.emit('temp', Math.floor(Math.random() * (40 - 20) + 20)), 6000);

    setInterval(() => socket.emit('turbidity', Math.floor(Math.random() * (100 - 10) + 10)), 6000);

    setInterval(() => socket.emit('ultrasonic', Math.floor(Math.random() * (500 - 30) + 30)), 6000);

    setInterval(() => socket.emit('waterlevel', Math.floor(Math.random() * (100 - 0) + 0)), 6000);
  }
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  },
}));

app.post('/api/signup', async (req, res) => {
  try {
    // eslint-disable-next-line prefer-const
    let { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'provide username and password' });
    }

    password = await bcrypt.hash(password, 10);

    await User.create({ username, password });
    return res.status(201).json({ message: 'User Created' });
  } catch (err) {
    console.log({ err });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    // eslint-disable-next-line prefer-const
    let { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'provide username and password' });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: 'User does not exist' });
    }

    const verifyPassword = await bcrypt.compare(password, user.password);

    if (!verifyPassword) {
      return res.status(400).json({ message: 'Password Incorrect' });
    }

    const token = jwt.sign({ username }, 'helloworld');
    return res.status(200).json({ message: 'Successful login', token });
  } catch (err) {
    console.log({ err });
  }
});

server.listen(process.env.PORT || 9000, () => console.log('server running'));
