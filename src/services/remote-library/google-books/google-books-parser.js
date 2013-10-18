/**
 * @author Kyle Brown <blackbarn@gmail.com>
 * @since 10/15/13 11:58 AM
 */

// Dependencies
var events = require('events');
var util = require('util');
var _ = require('lodash');
var Q = require('q');

// Local Dependencies

var errors = {
    EMPTY_RESPONSE: 'Google Books API Respnose is empty',
    RESPONSE_ERROR: 'Google Books API Responded with an unknown error',
    VOLUME_EMPTY: 'Volume is empty',
    NO_AUTHOR: 'Author could not be found for book',
    NO_ISBN: 'ISBN could not be found for book'
};

/**
 * Google Books Parser Service - helps in parsing google books api responses
 * @constructor
 */
var GoogleBooksParserService = function (providerName) {
    "use strict";
    this._providerName = providerName || 'googlebooks';
    events.EventEmitter.call(this);
};

util.inherits(GoogleBooksParserService, events.EventEmitter);

/**
 * Parses a single Google Books API Response
 * @param {object} body - The Google Books API Response object
 * @returns {Promise} A promise of type Promise<Object, Error>
 */
GoogleBooksParserService.prototype.parseResponse = function (body) {
    "use strict";
    var error, items, deferred;
    deferred = Q.defer();
    if (_.isEmpty(body)) {
        deferred.reject(new Error(errors.EMPTY_RESPONSE));
    } else if (body.error) {
        if (_.isEmpty(body.error.errors)) {
            error = errors.RESPONSE_ERROR;
        } else {
            error = body.error.errors[0].message + '. ' + body.error.errors[0].reason;
        }
        deferred.reject(new Error(error));
    } else {
        // handle single book response
        if (_.isUndefined(body.totalItems)) {
            items = [body];
        } else if (body.items) {
            //ensure no duplicate books
            items = _.uniq(body.items, function (item) {
                return item.id;
            });
        } else {
            items = [];
        }
        deferred.resolve(items);
    }
    return deferred.promise;
};

/**
 * Parses multiple Google Books API Responses
 * @param {Array} responses - An array of Google Books API Response objects
 * @returns {Promise} A promise of type Promise<Object[], Error>
 */
GoogleBooksParserService.prototype.parseResponses = function (responses) {
    "use strict";

    responses = responses || [];

    return Q.all(responses.map(this.parseResponse.bind(this))).then(function (itemSets) {
        //noinspection JSHint
        return _.uniq(_.flatten(itemSets), function (item) {
            return item.id;
        });
    });
};

/**
 * Parses the author of a book. Books may have none, one, or multiple authors.
 * Normalize by returning either no author, or just one author.
 * If the query used the inauthor: element, use its value to chose which author to return if multiple exist.
 * @param {object} volume - The google books book volume data
 * @param {string} query - The query used to search for this book
 * @returns {null|{string}}
 */
GoogleBooksParserService.prototype.parseAuthor = function (volume, query) {
    "use strict";
    var authorRegex, result, queriedAuthor, author;
    authorRegex = /inauthor:\s*([\w\s]+)/g;
    query = decodeURIComponent(query).replace('+', ' ');
    if (_.isEmpty(volume)) {
        return null;
    } else {
        if (volume.author) {
            return volume.author;
        } else if (volume.authors) {
            if (!_.isEmpty(query)) {
                result = authorRegex.exec(query);
                if (_.isArray(result) && !_.isEmpty(result[1])) {
                    queriedAuthor = result[1];
                    author = _.find(volume.authors, function (author) {
                        return (author && author.toLowerCase().indexOf(queriedAuthor.toLowerCase()) !== -1);
                    });
                    return author;
                } else {
                    return _.first(volume.authors);
                }
            } else {
                return _.first(volume.authors);
            }
        } else {
            return null;
        }
    }
};

/**
 * Parses the isbn of a book. Books may have none, one, or multiple isbns.
 * Normalize by returning either no isbn, or just one isbn.
 * @param {object} volume - The google books book volume data
 * @returns {null|{string}}
 */
GoogleBooksParserService.prototype.parseISBN = function (volume) {
    "use strict";
    var isbn;
    if (_.isEmpty(volume)) {
        return null;
    } else {
        if (volume.industryIdentifiers) {
            isbn = _.find(volume.industryIdentifiers, function (value) {
                return value.type === 'ISBN_10' || value.type === 'ISBN_13';
            });
            if (isbn && isbn.identifier) {
                return isbn.identifier;
            } else {
                return null;
            }
        } else {
            return null;
        }
    }
};

/**
 * Collate a list of authors given a list of books. Authors are granted a relevance rating (frequency of occurance)
 * @param {object[]} books - List of books to grab authors from
 * @returns {Promise} A promise of type Promise<Object[], Error>
 */
GoogleBooksParserService.prototype.collateAuthors = function (books) {
    "use strict";
    if (!books) {
        books = [];
    } else if (!_.isArray(books)) {
        books = [books];
    }
    return Q.all(_.reduce(books, function (counts, book) {
        counts[book.authorName] = (counts[book.authorName] || 0) + 1;
        return counts;
    }, {})).then(function (counts) {
        return Q.all(_.map(counts, function (count, name) {
            return {
                name: name,
                relevance: count,
                provider: this._providerName
            };
        }.bind(this)));
    }.bind(this));
};


module.exports = GoogleBooksParserService;