/* eslint-disable no-console */
var oecloud = require('oe-cloud');
var path = require('path');

process.env.ENABLE_COOKIE = process.env.ENABLE_COOKIE || true;
oecloud.boot(__dirname, function (err) {
  if (err) {
    console.error(err);
  }
  oecloud.start();
  oecloud.emit('loaded');
});

oecloud.get('/', function (req, res) {
  res.sendFile('index.html', { root: path.join(__dirname, '../client/') });
});