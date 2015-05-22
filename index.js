'use strict';

var fs = require('fs'),
    path = require('path'),
    _ = require('lodash'),
    extend = require('extend');
//var jf = require("jsonfile");
// return true if path is directory
var isDir = function (dir) {
    return fs.existsSync(dir) ? fs.lstatSync(dir).isDirectory() : false;
};

// return path of folder with same name as .json file if exists
var getNamesake = function (file) {
    var folder = path.dirname(file) + '/' + path.basename(file, '.json');
    return fs.existsSync(folder) && isDir(folder) ? folder : false;
};

// get the paths of files and folders inside a folder
var getFolderElements = function (parent) {
    var elems = fs.readdirSync(parent),
        d = {
            files: [],
            folders: []
        };

    // get files and folders paths
    elems.forEach(function (elem) {
        var el = parent + '/' + elem;
        if (!isDir(el)) {
            d.files.push(el);
        } else if (!fs.existsSync(el + '.json')) {
            // add folder only if has no namesake json
            d.folders.push(el);
        }
    });

    return d;
};


var getData = {

    // get file data and extend it with folder data of folder with same name
    file: function (file) {
        console.log(file);
        if(fs.existsSync(file)) {
            console.log(file + ' exists');
        }
        //var config = fs.existsSync(file)?jf.readFileSync(file):{},
        var config = fs.existsSync(file)?require(file):{},
            namesake = getNamesake(file);
        var returnValue = config;
        if (namesake) {
            if (Array.isArray(config)) {
                returnValue = _.union(config, _.values(getData.folder(namesake)))
            } else
                returnValue = extend(config, getData.folder(namesake))
        }
        return returnValue;
    },

    // get data from folders and files inside a folder
    folder: function (folder) {
        var elems = getFolderElements(folder);
        var result = {};

        // files
        elems.files.forEach(function (route) {
            // get object name
            var fileName = path.basename(route, '.json');
            // assign object data from file
            result[fileName] = getData.file(route);
        });

        // no namesake folders
        elems.folders.forEach(function (route) {
            // get object name
            var fileName = path.basename(route);
            // assign data from folder
            result[fileName] = extend(result[fileName] || {}, getData.folder(route));
        });
        //if(isArray) {
        //    return _.values(result);
        //}
        return result;
    }
};


module.exports = function () {
    var configs = [],
        i;

    if (!arguments.length) {
        return {};
    }

    for (i in arguments) {
        if (typeof arguments[i] !== 'string') {
            throw new Error('deep-json: bad file argument');
        }
        console.log(path.resolve(arguments[i]));
        configs[i] = getData.file(path.resolve(arguments[i]));
    }

    return extend.apply({}, configs);
};
