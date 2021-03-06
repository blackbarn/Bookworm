/**
 * @author Kyle Brown <blackbarn@gmail.com>
 * @since 10/22/13 2:54 PM
 */
// Dependencies
var events = require('events');
var util = require('util');
var _ = require('lodash');
var Q = require('q');
var moment = require('moment');
var qfs = require('q-io/fs');
var path = require('path');
var db = require('../../config/models');

// Local Dependencies
var logger = require('../log');

/**
 * Post Process Service
 * Processes the download directory for releases and moves them to the configured location.
 * @param {object} [options] - Options object for configuration.
 * @constructor
 */
var PostProcessService = function (options) {
    "use strict";

    events.EventEmitter.call(this);
    this._defaults = {};
    this._safePathRegex = '[^ 0-9a-zA-Z-[]()_\/]';
    this._settings = _.merge({}, this._defaults, options || {});

};

util.inherits(PostProcessService, events.EventEmitter);

/**
 * Update the instance settings
 * @param {object} options - Updated options object
 */
PostProcessService.prototype.updateSettings = function (options) {
    "use strict";
    logger.log('debug', 'updating settings');
    this._settings = _.merge({}, this._defaults, options || {});
};

/**
 * Retrieve a list of directories that are in the download directory
 * @returns {Promise} A promise of type Promise<String[], Error>
 */
PostProcessService.prototype.getDirectories = function () {
    "use strict";

    return qfs.listTree(this._settings.downloadDirectory).then(function (files) {
        return Q.all(files.map(function (file) {
            return qfs.stat(file).then(function (stat) {
                return {
                    isDirectory: stat.isDirectory(),
                    file: file
                };
            }.bind(this));
        }.bind(this)));
    }.bind(this)).then(function (files) {
        return _.pluck(_.filter(files, function (file) {
            return file.isDirectory;
        }), 'file');
    });

};

/**
 * Retrieve a release for the given directory, if any.
 * @param {string} directory - The directory to check for a release
 * @returns {Promise} A promise of type Promise<Release, Error>
 */
PostProcessService.prototype.getDirectoryRelease = function (directory) {
    "use strict";

    return Q.fcall(function () {
        var guid, results, regex;
        guid = null;
        regex = /\.bw\(([A-Za-z0-9\-]+)\)$/g;

        results = regex.exec(directory);

        if (results && results[1]) {
            guid = results[1];
        }
        return guid;
    }).then(function (guid) {
        if (guid) {

            return db.Release.find({
                where: {
                    guid: guid
                }
            }).then(function (release) {
                if (release) {
                    release.directory = directory;
                }
                return release;
            });
        } else {
            return null;
        }
    });
};

/**
 * Resolves a path containing a pattern for folder name generation.
 * @param {string} pattern - the pattern string e.g., $First/$Author/$Title
 * @param {string} author - The author name
 * @param {string} title - The book title
 * @param {Date} date - The book published date
 * @returns {null}
 */
PostProcessService.prototype.resolvePatternPath = function (pattern, author, title, date) {
    "use strict";
    var replacers, firstLetter, path;

    path = pattern;

    firstLetter = author.slice(0, 1);

    replacers = {
        '$First': firstLetter.toUpperCase(),
        '$first': firstLetter.toLowerCase(),
        '$Author': author,
        '$author': author.toLowerCase(),
        '$Title': title,
        '$title': title.toLowerCase(),
        '$Year': moment(date).format('YYYY')
    };

    _.forEach(replacers, function (value, key) {
        path = path.replace(key, value);
    });

    //noinspection JSHint
    return ((_.isEmpty(path)) ? null : path.replace(new RegExp(this._safePathRegex, 'g'), ''));
};

/**
 * Move a release from the download directory to the configured destination.
 * @param {object} release - The release object
 * @param {object} book - The book that goes with the release
 * @returns {Promise} A promise of type Promise<Release, Error>
 */
PostProcessService.prototype.moveRelease = function (release, book) {
    "use strict";
    var folderName, destinationDirectory, sourceDirectory;

    sourceDirectory = release.directory;

    folderName = this.resolvePatternPath(this._settings.folderFormat, book.authorName, book.title, book.published);

    destinationDirectory = path.join(this._settings.destinationDirectory, folderName);

    logger.log('info', 'Moving release to destination directory', {release: release.title, directory: destinationDirectory});

    return qfs.exists(sourceDirectory)
    .then(function (exists) {
        if (exists) {
            return sourceDirectory;
        } else {
            throw new Error('Directory ' + sourceDirectory + ' for release no longer exists');
        }
    }).then(function () {
        logger.log('debug', 'Creating destination directory', {directory: destinationDirectory});
        return qfs.makeTree(destinationDirectory, this._settings.directoryPermissions);
    }.bind(this))
    .then(function () {
        logger.log('debug', 'Copying directory', {from: sourceDirectory, to: destinationDirectory});
        return qfs.copyTree(sourceDirectory, destinationDirectory);
    })
    .then(function () {
        if (this._settings.keepOriginalFiles) {
            return null;
        } else {
            logger.log('debug', 'Removing original release directory', {directory: sourceDirectory});
            return qfs.removeTree(sourceDirectory);
        }
    }.bind(this))
    .then(function () {
        release.directory = destinationDirectory;
        return release;
    });
};

/**
 * Write an OPF XML file to the specified directory using data from book.
 * @param {object} book - The book object
 * @param {string} destinationDirectory - the full path to the directory to output the opf file.
 * @returns {Promise} A promise of type Promise<Undefined, Error>
 */
PostProcessService.prototype.writeOpf = function (book, destinationDirectory) {
    "use strict";
    if (book) {
        return book.getOpf().then(function (opf) {
            return qfs.write(path.join(destinationDirectory, this._settings.opfName), opf);
        }.bind(this));
    } else {
        return Q.fcall(function () {
            throw new Error('No book to write opf from');
        });
    }
};

/**
 * Process a single release
 * @param {object} release - The release object
 * @returns {Promise} A promise of type Promise<Release, Error>
 */
PostProcessService.prototype.processRelease = function (release) {
    "use strict";
    if (release) {
        logger.log('info', 'Processing release', {release: release.title});
        return release.getBook().then(function (book) {
            if (book && book.status === 'snatched') {
                return this.moveRelease(release, book).then(function (release) {
                    book.status = 'downloaded';
                    release.status = 'downloaded';
                    return Q.all([book.save(), release.save()]).spread(function (book, release) {
                        logger.log('info', 'Finished processing book', {title: book.title});
                        this.emit('processed', book, release);
                        return this.writeOpf(book, release.directory).then(function () {
                            return release;
                        });
                    }.bind(this));
                }.bind(this));
            } else {
                return release;
            }
        }.bind(this));
    } else {
        return Q.fcall(function () {
            throw new Error('No release to process');
        });
    }
};

/**
 * Process the download directory
 * @returns {Promise} A promise of type Promise<Release[], Error>
 */
PostProcessService.prototype.process = function () {
    "use strict";
    return this.getDirectories().then(function (directories) {
        return Q.all(directories.map(this.getDirectoryRelease)).then(function (releases) {
            return _.compact(releases);
        }).then(function (releases) {
            return Q.all(releases.map(this.processRelease.bind(this)));
        }.bind(this));
    }.bind(this)).then(function (releases) {
        logger.log('info', 'Post Processor finished. Processed releases', {count: releases.length});
        return releases;
    }).fail(function (err) {
        logger.log('error', err.message, err.stack);
        throw err;
    });
};

module.exports = PostProcessService;