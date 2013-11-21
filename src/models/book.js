/**
 * @author Kyle Brown <blackbarn@gmail.com>
 * @since 10/16/13 4:09 PM
 */
// Dependencies

// Local Dependencies
var db = require('../config/database').db;


// Helpers
var bookStatuses = ['wanted', 'wanted_new', 'skipped', 'downloaded', 'snatched', 'excluded'];

var Book = db.define('Book', {
    guid: {
        type: String,
        index: true
    },
    title: String,
    authorName: String,
    link: {
        type: String,
        'default': ''
    },
    author: {
        type: Object,
        'default': {}
    },
    releases: {
        type: Object,
        'default': {}
    },
    description: String,
    pageCount: Number,
    publisher: String,
    language: String,
    averageRating: Number,
    isbn: String,
    provider: String,
    apiLink: String,
    image: {
        type: String,
        "default": '/img/no-image.png'
    },
    imageSmall: {
        type: String,
        "default": '/img/no-image.png'
    },
    status: {
        type: String,
        'default': bookStatuses[1]
    },
    published: Date,
    updated: Date
});

// Validation
Book.validatesPresenceOf('guid', 'title', 'status');
Book.validatesInclusionOf('status', {
    in: bookStatuses
});
Book.validatesUniquenessOf('guid', {
    message: 'Book GUID must bee unique.'
});

Book.prototype.isWanted = function () {
    "use strict";
    return this.status === 'wanted' || this.status === 'wanted_new';
};
module.exports = Book;