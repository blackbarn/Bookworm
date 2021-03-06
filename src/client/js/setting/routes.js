/**
 * @author Kyle Brown <blackbarn@gmail.com>
 * @since 10/24/13 8:56 AM
 */
/*global angular*/
(function (angular) {
    'use strict';
    var module = angular.module('bookworm.setting.routes', [], function () {});

    module.config(['$stateProvider', function ($stateProvider) {

        $stateProvider
            .state('settings', {
                url: '/settings',
                templateUrl: 'partials/settings/general',
                controller: 'SettingsCtrl'
            })
            .state('settings-search-newznab', {
                url: '/settings/search/newznab',
                templateUrl: 'partials/settings/search-newznab',
                controller: 'SettingsCtrl'
            })
            .state('settings-search-googlebooks', {
                url: '/settings/search/googlebooks',
                templateUrl: 'partials/settings/search-google-books',
                controller: 'SettingsCtrl'
            })
            .state('settings-download', {
                url: '/settings/download',
                templateUrl: 'partials/settings/download',
                controller: 'SettingsCtrl'
            })
            .state('settings-notify', {
                url: '/settings/notify',
                templateUrl: 'partials/settings/notify',
                controller: 'SettingsCtrl'
            })
            .state('settings-postProcess', {
                url: '/settings/postProcess',
                templateUrl: 'partials/settings/post-process',
                controller: 'SettingsCtrl'
            })
            .state('settings-manage', {
                url: '/settings/manage',
                templateUrl: 'partials/settings/manage',
                controller: 'SettingsCtrl'
            }).state('settings-about', {
                url: '/settings/about',
                templateUrl: 'partials/settings/about',
                controller: 'SettingsCtrl'
            });
    }]);
}(angular));