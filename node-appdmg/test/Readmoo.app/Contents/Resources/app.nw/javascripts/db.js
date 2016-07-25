var $ = require('jquery');

var DB = {
  initialize: null,
  users: {},
  library: {
    update: {}
  },
  readings: {

  },
  utils: {
    clear: {} 
  }
};

DB.initialize = require('./db/initialize');

DB.utils.clear = require('./db/clear');



DB.users.addUserProfile = require('./db/addUserProfile');
DB.users.readUserProfile = require('./db/readUserProfile');

DB.library.addFullLibrary = require('./db/addFullLibrary');
DB.library.readFullLibrary = require('./db/readFullLibrary');

DB.readings.addReadings = require('./db/addReadings');
DB.readings.readFullReadings = require('./db/readFullReadings');

module.exports = DB;