'use strict';
var app = require('oe-cloud');
const path = require('path');
const fs = require('fs');

let serverFolderPath = process.argv[2];
try {
    if (typeof serverFolderPath !== 'string' || !fs.statSync(serverFolderPath).isDirectory()) {
        serverFolderPath = path.resolve(__dirname,'../../../../server');
    } else {
        serverFolderPath = path.resolve(serverFolderPath);
    }
} catch (err) {
    console.error(err);
    process.exit(1);
}

let appRootFolder = path.resolve(serverFolderPath, '../')

console.log('Server folder path: ' + serverFolderPath);
console.log('App root folder path: ' + appRootFolder);

app.boot(serverFolderPath, function (err) {
    if (err) { console.log(err); process.exit(1); }

    var m = require('oe-migration');
    m.migrate(function (err, oldDbVersion, migratedVersions) {
        if (err) process.exit(1); else process.exit(0);
    });
});