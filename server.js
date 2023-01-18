/* eslint-disable consistent-return */
/* eslint-disable no-await-in-loop */
/* eslint-disable max-len */
/* eslint-disable camelcase */
const express = require('express');
const { CronJob } = require('cron');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const socketioJwt = require('socketio-jwt');
require('dotenv').config();

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, { cors: { origin: '*' } });
const InitiateMongoServer = require('./db');
const User = require('./userModel');
const Level = require('./levelModel');
const Sensor = require('./sensorModel');

// Initiate MongoDB
InitiateMongoServer();

io.use(socketioJwt.authorize({
  secret: 'helloworld',
  handshake: true,
  auth_header_required: true,
}));

function formatTime(myDate) {
  const date = new Date(myDate);
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });
  return formattedTime;
}

io.on('connection', async (socket) => {
  const { username } = socket.decoded_token;
  const valid = await User.findOne({ username });
  if (valid) {
    const interval = 30000;

    setInterval(() => {
      const ph = (Math.floor(Math.random() * 14) + 1);
      const temp = (Math.floor(Math.random() * (40 - 20) + 20));
      const turbidity = (Math.floor(Math.random() * (100 - 10) + 10));
      const ultrasonic = (Math.floor(Math.random() * (500 - 30) + 30));

      // const sensor = new Sensor({
      //   ph,
      //   temp,
      //   turbidity,
      //   ultrasonic,
      // });

      // sensor.save()
      //   .then((result) => {
      //     console.log(result);
      //   })
      //   .catch((err) => {
      //     console.log(err);
      //   });
      socket.emit('sensor', {
        ph,
        temp,
        turbidity,
        ultrasonic,
      });
    }, interval);

    setInterval(async () => {
      const sensors = await Sensor.find({ }).sort('-createdAt').limit(12);

      // map through the sensors and return the values and format the date to a readable time format
      const graphData = sensors.map((sensor) => ({
        ph: sensor.ph,
        temp: sensor.temp,
        turbidity: sensor.turbidity,
        ultrasonic: sensor.ultrasonic,
        time: formatTime(sensor.createdAt),
      }));
      socket.emit('graph', {
        ...graphData,
      });
    }, 120000);
  }
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  },
}));
app.use(cors({ credentials: true, origin: '*' }));

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

app.post('/api/water-level', async (req, res) => {
  try {
    // eslint-disable-next-line prefer-const
    let { waterLevel } = req.body;
    console.log({ waterLevel });

    if (!waterLevel) {
      return res.status(400).json({ message: 'provide water level' });
    }

    await Level.create({ waterLevel });

    return res.status(200).json({ message: 'Water level saved sussceefully' });
  } catch (err) {
    console.log({ err });
  }
});

app.get('/api/water-level', async (req, res) => {
  try {
    // Get the latest value from the table
    const waterLevel = await Level.findOne().sort({ createdAt: -1 });
    return res.status(200).json({ waterLevel });
  } catch (err) {
    console.log({ err });
  }
});

app.get('/api/sensors', async (req, res) => {
  try {
    const { filter } = req.query;
    let sensors;
    switch (filter) {
      case 'thirty_mins':
        sensors = await Sensor.find({ createdAt: { $gte: new Date(new Date().getTime() - 30 * 60 * 1000) } }).sort('-createdAt').limit(100);
        console.log(sensors.length);
        break;

      case 'sixty_mins':
        sensors = await Sensor.find({ createdAt: { $gte: new Date(new Date().getTime() - 60 * 60 * 1000) } }).sort('-createdAt').limit(100);
        break;

      case 'ninety_mins':
        sensors = await Sensor.find({ createdAt: { $gte: new Date(new Date().getTime() - 90 * 60 * 1000) } }).sort('-createdAt').limit(100);
        break;

      case 'two_hours':
        sensors = await Sensor.find({ createdAt: { $gte: new Date(new Date().getTime() - 2 * 60 * 60 * 1000) } }).sort('-createdAt').limit(100);
        break;

      case 'three_hours':
        sensors = await Sensor.find({ createdAt: { $gte: new Date(new Date().getTime() - 3 * 60 * 60 * 1000) } }).sort('-createdAt').limit(100);
        break;

      case 'six_hours':
        sensors = await Sensor.find({ createdAt: { $gte: new Date(new Date().getTime() - 6 * 60 * 60 * 1000) } }).sort('-createdAt').limit(100);
        break;

      default:
        sensors = await Sensor.find().sort('-createdAt').limit(100);
        break;
    }
    return res.status(200).json({ sensors });
  } catch (err) {
    console.log({ err });
  }
});

(async () => {
  const job = new CronJob('0 0 * * *', async () => {
    let currentPage = 0;
    let totalSensors = 1;
    let skip = 0;
    const limit = 500;
    // eslint-disable-next-line no-console
    console.log('Cron job started');

    while (skip < totalSensors) {
      // eslint-disable-next-line no-plusplus
      currentPage++;
      skip = (currentPage - 1) * limit;

      const sensors = await Sensor.find().sort({ createdAt: -1 }).limit(limit);
      const total = await Sensor.countDocuments();

      if (total > 1000) {
        // eslint-disable-next-line no-underscore-dangle
        await Sensor.deleteMany({ _id: { $in: sensors.map((s) => s._id) } });
        console.log('deleted', sensors.length, 'sensors');
      }

      totalSensors = total;
    }
  }, null, true, 'Africa/Lagos');
  job.start();
})();

server.listen(process.env.PORT || 9000, () => console.log('server running'));
