'use strict';

// TODO(mkhatib): Seperate these into config/routes.js and
// config/interceptors/httpInterceptors.js and add tests for them.
// TODO(mkhatib): Move the autogenerated appConfig.js to config/constants.js.

angular.module('webClientApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ngRoute',
  'AppConfig',
])
  /**
   * Routing.
   */
  .config(['$routeProvider', function ($routeProvider) {

    /**
     * Checks proper access to the route and reject it if unauthenticated.
     */
    var checkAccess = function(config) {
      return {
        load: ['$q', '$location', 'LoginService', function($q, $location, LoginService) {
          if(LoginService.isAuthorized(config.isPublic)) {
            var deferred = $q.defer();
            deferred.resolve();
            return deferred.promise;
          } else {
            return $q.reject({
              redirectTo: '/login',
              previous: $location.path()
            });
          }
        }]
      };
    };


    $routeProvider

      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        resolve: checkAccess({
          isPublic: true
        })
      })

      .when('/login', {
        templateUrl: 'views/login.html',
        controller: 'LoginCtrl',
        resolve: checkAccess({
          isPublic: true
        })
      })

      .when('/signup', {
        templateUrl: 'views/signup.html',
        controller: 'SignupCtrl',
        isPublic: true
      })

      .when('/articles/:articleId', {
        templateUrl: 'views/articles/show.html',
        controller: 'ArticleCtrl',
        resolve: checkAccess({
          isPublic: false
        })
      })

      .otherwise({
        redirectTo: '/'
      });
  }])
  /**
   * Intercept every http request and check for 401 Unauthorized
   * error. Clear the current user and redirect to /login page.
   */
  .config(['$httpProvider', function ($httpProvider) {
    var unAuthenticatedInterceptor = ['$location', '$q', function ($location, $q) {

      var success = function (response) {
        return response;
      };

      var error = function (response) {
        if (response.status === 401) {
          $location.path('/login');
          return $q.reject(response);
        }
        else {
          return $q.reject(response);
        }
      };

      return function (promise) { return promise.then(success, error); };
    }];
    $httpProvider.responseInterceptors.push(unAuthenticatedInterceptor);
    $httpProvider.defaults.headers.common['Content-Type'] = 'application/json';
  }])
  /**
   * Everytime the route change check if the user need to login.
   */
  .run(['$location', '$rootScope', 'LoginService',
      function ($location, $rootScope, LoginService) {

    // If the user is already logged in init the auth headers.
    LoginService.initAuthHeaders();

    // Listen to $routeChangeError and redirect the user.
    $rootScope.$on('$routeChangeError', function(event, current, previous, rejection) {
      if(rejection && rejection.redirectTo) {
        $location.path(rejection.redirectTo).search('prev', rejection.previous);
      }
    });

  }]);
