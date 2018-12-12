var express = require('express');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var mongoose = require('mongoose');
var restify = require('express-restify-mongoose');

var path = require('path');  // To get file extension
var multer  = require('multer');  // multipart form handling
var Grid = require('gridfs-stream');
var GridFsStorage = require('multer-gridfs-storage');

var DELAY_EMITTING_NOTIFICATION_MS = 3000;

require('dotenv').config();


//============================
//  Global settings
//============================

var app = express();
var router = express.Router();
const io = app.io = require('socket.io')();

// CORS
io.set('origins', '*:*');

io.on('connection', (socket) => {
  console.log('socket.io connected');

  socket.on('image sent', (msg) => {
    console.log('socket.io invoked');
    // io.emit('image received', msg);
  });
});

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static('public'));



//============================
//  Mongo settings
//============================

const mongoHostPort     = process.env.MONGO_ADDR;
const mongoDatabaseName = process.env.MONGO_DB_NAME;
const mongoImageCollection = process.env.MONGO_COL_NAME;
const mongoUser         = process.env.MONGO_USER;
const mongoPass         = process.env.MONGO_PASS;

var mongoUserPass = '';
if (mongoUser && mongoUser.length !== 0) {
  mongoUserPass = mongoUser + ':' + mongoPass + '@';
}
const mongoUrl = 'mongodb://' + mongoUserPass + mongoHostPort + '/' + mongoDatabaseName;

mongoose.connect(mongoUrl);
const conn = mongoose.connection;
var gfs;
conn.on('error', function() {console.log('connection error:')});
conn.once('open', function() {
  // Used for reading
  console.log('mongo.db connected');
  gfs = Grid(conn.db, mongoose.mongo);
});

// Model registration
// TODO: better to be a separated file
restify.serve(router, mongoose.model('Post', new mongoose.Schema({
  comment: { type: String },
  filename: { type: String }
})));
app.use(router);

console.log(mongoose.connection.db);

// Used for writing
let storage = GridFsStorage({
  url: mongoUrl,

  file: (req, file) => {
    return new Promise((resolve, reject) => {
      const filename = 'file_' + Date.now() + path.extname(file.originalname);
      setTimeout(() => {
        io.emit('image received', filename);
      }, DELAY_EMITTING_NOTIFICATION_MS);
      console.log('image received! file:' + filename);

      resolve({
        filename: filename,
        bucketName: mongoImageCollection,
      });
    });
  },
});

//============================
//  Download
//============================

app.get('/api/file/:filename', (req, res) => {
  // gfs.collection(mongoImageCollection + '.files');
  gfs.collection(mongoImageCollection);
  // gfs.exist({filename: req.params.filename}, function(err, found) {
  //   console.log("exists?");
  // })

  console.log("looking for a file: " + req.params.filename);
  gfs.files.find({filename: req.params.filename}).toArray(function(err, files) {

      if (!files || files.length === 0){
        console.log("file does not exist: " + req.params.filename);
        console.log(err);
        return res.status(404).json({
            responseCode: 1,
            responseMessage: "error"
        });
      }
      console.log("file exists: " + req.params.filename);
      // create read stream
      var readstream = gfs.createReadStream({
          filename: files[0].filename,
          root: mongoImageCollection
      });
      // set the proper content type 
      res.set('Content-Type', files[0].contentType)
      // Return response
      return readstream.pipe(res);
  });
});

//============================
//  Upload
//============================

var upload = multer({ storage: storage });
app.post('/api/upload', upload.single('image'), function (req, res, next) {
  delete req.file.buffer; // do not include in response
  res.json(req.file);
});
/////

// healthcheck
app.get('/api/healthcheck', function (req, res, next) {
  res.json({'status': 'ok'});
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  console.log(err.message);

  // render the error page
  res.status(err.status || 500);
  res.send({error:'error'});
});

module.exports = app;

