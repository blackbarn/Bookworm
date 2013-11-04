/**
 * @author Kyle Brown <blackbarn@gmail.com>
 * @since 10/23/13 3:12 PM
 */
/*global angular*/
(function (angular) {
    'use strict';

    angular.module('ui', ['ui.router', 'ui.route', 'ui.inflector', 'ui.event'], function () {});

    angular.module('bookworm.notify', ['bookworm.notify.controllers'], function () {});
    angular.module('bookworm.setting', ['bookworm.setting.routes', 'bookworm.setting.directives', 'bookworm.setting.controllers'], function () {});

    angular.module('bookworm.log', ['bookworm.log.routes', 'bookworm.log.controllers'], function () {});

    angular.module('bookworm.search', ['bookworm.search.routes', 'bookworm.search.directives', 'bookworm.search.controllers'], function () {});

    angular.module('bookworm.core', ['bookworm.core.routes', 'bookworm.core.directives', 'bookworm.core.controllers', 'bookworm.core.filters'], function () {});

    angular.module('bookworm.book', ['bookworm.book.routes', 'bookworm.book.directives', 'bookworm.book.controllers'], function () {});

    angular.module('bookworm.author', ['bookworm.author.routes', 'bookworm.author.directives', 'bookworm.author.controllers'], function () {});

    angular.module('bookworm.release', ['bookworm.release.directives'], function () {});

    angular.module('bookworm', ['ui', 'ui.bootstrap', 'ngAnimate', 'toaster', 'restangular', 'ngProgressLite', 'truncate', 'bookworm.core',
            'bookworm.book', 'bookworm.author', 'bookworm.release', 'bookworm.search', 'bookworm.log', 'bookworm.setting', 'bookworm.notify'],
            ['RestangularProvider', function (RestangularProvider) {
        RestangularProvider.setBaseUrl('/api/v1');
        RestangularProvider.setDefaultHeaders({'X-Requested-With': 'XMLHttpRequest'});
    }])
    .run(['Restangular', 'ngProgressLite', function (Restangular, ngProgressLite) {
        Restangular.setRequestInterceptor(function (element) {
            ngProgressLite.start();
            return element;
        });
        Restangular.setResponseInterceptor(function (response, operation) {
            ngProgressLite.done();
            var newResponse;
            if (operation === 'getList' && response.data) {
                newResponse = response.data;
                newResponse.metadata = response._metadata;
            } else {
                newResponse = response;
            }
            return newResponse;
        });
        Restangular.setErrorInterceptor(function (response) {
            ngProgressLite.done();
            return response;
        });
    }]);



}(angular));