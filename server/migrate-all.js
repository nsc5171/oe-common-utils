'use strict';
var app = require('oe-cloud');
var async = require('async');
var m = require('oe-migration');
var path = require('path');
var fs = require('fs');

let serverFolderPath = process.argv[2];
try {
    if (typeof serverFolderPath !== 'string' || !fs.statSync(serverFolderPath).isDirectory()) {
        serverFolderPath = path.resolve('../../../server');
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

    var appList = getAppList();

    async.eachOfSeries(appList, function (mdl, key, cb) {
        m.migrate({ moduleName: mdl.moduleName, basePath: mdl.basePath }, function (err, oldDbVersion, migratedVersions) {
            cb(err);
        });
    }, function (err) {
        if (err) {
            console.log(err);
            process.exit(1);
        } else {
            console.log('migration done');
            process.exit(0);
        }
    });
});


function getAppList() {
    var appList = [];
    var mdls = require(path.join(serverFolderPath, 'app-list.json'));
    mdls.forEach(function (o) {
        var bPath;
        if (o.path === './') {
            bPath = path.resolve(appRootFolder, 'db');
        } else {
            bPath = path.resolve(appRootFolder, 'node_modules', o.path, 'db');
        }
        var isDir = false;
        try {
            isDir = fs.statSync(bPath).isDirectory();
            if (isDir === true) appList.push({ moduleName: o.path, basePath: bPath });
        } catch (e) {
            if (e) console.log('Ignoring module', o.path, ' : No db folder');
        }
    });
    return appList;
}