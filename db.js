const mongoose = require('mongoose');

const { MONGODB_URI } = process.env;

const InitiateMongoServer = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    });
    console.log('Connected to DB');
  } catch (ex) {
    console.log(ex);
  }
  return true;
};

module.exports = InitiateMongoServer;
