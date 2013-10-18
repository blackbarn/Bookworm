/**
 * @author Kyle Brown <blackbarn@gmail.com>
 * @since 10/10/13 12:58 PM
 */
var settingsService = require('../services/setting');

//noinspection JSUnusedLocalSymbols
/**
 * Render the main index page
 * @param {object} req - The Request object.
 * @param {object} res - The Response object.
 * @param {function} next - callback to next middleware
 */
function index (req, res, next) {
    "use strict";
    res.render('index');
}

//noinspection JSUnusedLocalSymbols
/**
 * Render a partial by name
 * @param {object} req - The Request object.
 * @param {object} res - The Response object.
 * @param {function} next - callback to next middleware
 */
function partial (req, res, next) {
    'use strict';
    var name, category;
    name = req.params.name;
    category = req.params.category;
    res.render('partials/' + category + '/' + name, {
        env: settingsService.get('environment:env')
    });
}

//noinspection JSUnusedLocalSymbols
/**
 * Default Route
 * @param {object} req - The Request object.
 * @param {object} res - The Response object.
 * @param {function} next - callback to next middleware
 */
function unknown (req, res, next) {
    'use strict';
    res.send(404);
}

//noinspection JSUnusedLocalSymbols
/**
 * API Unauthorized Route
 * @param {object} req - The Request object.
 * @param {object} res - The Response object.
 * @param {function} next - callback to next middleware
 */
function apiUnauthorized (req, res, next) {
    "use strict";
    res.send(401);
}
/**
 * Set up the routes
 * @param {object} app - reference to express application.
 */
function setup (app) {
    "use strict";
    app.get('/', index);
    app.get('/partials/:category/:name', partial);
    app.get('/api/unauthorized', apiUnauthorized);
    app.get('*', unknown);
}

module.exports.setup = setup;