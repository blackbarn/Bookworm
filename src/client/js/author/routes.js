/**
 * @author Kyle Brown <blackbarn@gmail.com>
 * @since 10/24/13 8:56 AM
 */
/*global angular*/
(function (angular) {
    'use strict';
    var module = angular.module('bookworm.author.routes', [], function () {});

    module.config(['$stateProvider', function ($stateProvider) {
        $stateProvider
            .state('authors', {
                url: '/authors',
                templateUrl: 'partials/authors/author-list',
                controller: 'AuthorsCtrl',
                resolve: {
                    authors: ['Restangular', function (Restangular) {
                        return Restangular.all('authors').getList({expand: ''});
                    }]
                }
            })
            .state('author', {
                url: '/authors/{id}',
                templateUrl: 'partials/authors/author',
                controller: 'AuthorCtrl',
                resolve: {
                    author: ['Restangular', '$stateParams', function (Restangular, $stateParams) {
                        return Restangular.one('authors', $stateParams.id).get({expand: 'book'});
                    }]
                }
            });
    }]);
}(angular));