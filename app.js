// Importing required modules
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
var livereload = require("livereload");
var connectLiveReload = require("connect-livereload");
require('dotenv').config();
require('./middleware/Passport.js')(passport);

const app = express();

if (process.env.ENVIRONMENT = 'dev') {
  const liveReloadServer = livereload.createServer();
  liveReloadServer.server.once("connection", () => {
    setTimeout(() => {
      liveReloadServer.refresh("/");
    }, 100);
  
  });
  
  app.use(connectLiveReload());
}

// Express settings
app.set('trust proxy', 1); // Trust first proxy
app.set('view engine', 'ejs'); // Set the view engine to ejs

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.SESSION_SECRET === 'production', maxAge: 1000 * 60 * 60 * 24 }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Package size middleware
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));

// Static file middleware for serving styles, scripts and assets
app.use("/styles", express.static(__dirname + "/views/styles"));
app.use("/scripts", express.static(__dirname + "/views/scripts"));
app.use("/assets", express.static(__dirname + "/views/assets"));

//Navigation routing
app.use('/', require('./routes/navigation'));
// API Routing
app.use('/api/v1/authenticate', require('./routes/authenticate.js'));
app.use('/api/v1/MinistryPlatformAPI', require('./routes/ministryPlatformAPI.js'));

// Starting the server
const port = process.env.PORT || 3000;
(async () => {
  try {
    app.listen(port, console.log(`\n Server is listening on port ${port}\n http://localhost:${port}`));
  } catch (error) { console.log(error) }
})();
