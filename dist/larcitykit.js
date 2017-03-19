/*********************** angular-uuid.js ***********************/



/*********************** constants.js ***********************/
angular.module('larcity-constants', [])
    .constant("Constants", {
        Event: {
            Auth: {
                REQUIRED: 'app:auth:loginRequired',
                LOGIN_CONFIRMED: 'app:auth:loginConfirmed',
                LOGIN_CANCELED: 'app:auth:loginCanceled'
            }
        },
        Permission: {
            GEOLOCATION: 'permission.geolocation'
        }
    });


/*********************** auth-interceptor.js ***********************/
/*global angular:true, browser:true */

/**
 * @license HTTP Auth Interceptor Module for AngularJS
 * (c) 2012 Witold Szczerba
 * License: MIT
 */
(function () {
  'use strict';

  angular.module('http-auth-interceptor', ['http-auth-interceptor-buffer'])

  .factory('authService', ['$rootScope','httpBuffer', function($rootScope, httpBuffer) {
    return {
      /**
       * Call this function to indicate that authentication was successfull and trigger a
       * retry of all deferred requests.
       * @param data an optional argument to pass on to $emit which may be useful for
       * example if you need to pass through details of the user that was logged in
       */
      loginConfirmed: function(data, configUpdater) {
        var updater = configUpdater || function(config) {return config;};
        $rootScope.$emit('app:auth-loginConfirmed', data);
        httpBuffer.retryAll(updater);
      },

      /**
       * Call this function to indicate that authentication should not proceed.
       * All deferred requests will be abandoned or rejected (if reason is provided).
       * @param data an optional argument to pass on to $emit.
       * @param reason if provided, the requests are rejected; abandoned otherwise.
       */
      loginCancelled: function(data, reason) {
        httpBuffer.rejectAll(reason);
        $rootScope.$emit('app:auth-loginCancelled', data);
      }
    };
  }])

  /**
   * $http interceptor.
   * On 401 response (without 'ignoreAuthModule' option) stores the request
   * and broadcasts 'app:angular-auth-loginRequired'.
   */
  .config(['$httpProvider', function($httpProvider) {
    $httpProvider.interceptors.push(['$rootScope', '$q', 'httpBuffer', function($rootScope, $q, httpBuffer) {
      return {
        responseError: function(rejection) {
            console.log("Rejection >>");
            console.log(rejection);
            /** @TODO handle no connection **/
            /** @TODO check origin domain of 401 error **/
            if (rejection.status === 401) {
              var deferred = $q.defer();
              httpBuffer.append(rejection.config, deferred);
              $rootScope.$emit('app:auth-loginRequired', rejection);
              return deferred.promise;
            }
            // otherwise, default behaviour
            return $q.reject(rejection);
        }
      };
    }]);
  }]);

  /**
   * Private module, a utility, required internally by 'http-auth-interceptor'.
   */
  angular.module('http-auth-interceptor-buffer', [])

  .factory('httpBuffer', ['$injector', function($injector) {
    /** Holds all the requests, so they can be re-requested in future. */
    var buffer = [];

    /** Service initialized later because of circular dependency problem. */
    var $http;

    function retryHttpRequest(config, deferred) {
      function successCallback(response) {
        deferred.resolve(response);
      }
      function errorCallback(response) {
        deferred.reject(response);
      }
      $http = $http || $injector.get('$http');
      $http(config).then(successCallback, errorCallback);
    }

    return {
      /**
       * Appends HTTP request configuration object with deferred response attached to buffer.
       */
      append: function(config, deferred) {
        buffer.push({
          config: config,
          deferred: deferred
        });
      },

      /**
       * Abandon or reject (if reason provided) all the buffered requests.
       */
      rejectAll: function(reason) {
        if (reason) {
          for (var i = 0; i < buffer.length; ++i) {
            buffer[i].deferred.reject(reason);
          }
        }
        buffer = [];
      },

      /**
       * Retries all the buffered requests clears the buffer.
       */
      retryAll: function(updater) {
        for (var i = 0; i < buffer.length; ++i) {
          retryHttpRequest(updater(buffer[i].config), buffer[i].deferred);
        }
        buffer = [];
      }
    };
  }]);
})();


/*********************** larcity.js ***********************/
var LarCity = (function () {
    function LarCity() {
        var _this = this;

        // @TODO replace with library        
        _this.isValidURL = function (textval) {
            var re = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/;
            //var re = new RegExp(options.urlRegExp);
            return re.test(textval);
        };

        // @TODO replace with library        
        _this.isValidEmail = function (email) {
            var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            //var re = new RegExp(options.emailRegExp);
            return re.test(email);
        };

        _this.isNumericKeyCode = function (keyCode, elem) {
            // engn.log(elem);
            if ((keyCode >= 48 && keyCode <= 57)
                || (keyCode >= 96 && keyCode <= 105)
                || [107, 108, 110, 8, 9, 45, 46, 16, 37, 38, 39, 40].indexOf(keyCode) !== -1
                || (190 === keyCode && elem.val().split(".").length < 2)) {
                return true;
            } else {
                // console.log(keyCode);
                return false;
            }
        };

        // @TODO use faker instead!
        _this.randomString = function (length, chars) {
            if (!chars) chars = 'aA#'; // default to alphabets (lower and upper case) and numbers
            var mask = '';
            if (chars.indexOf('a') > -1)
                mask += 'abcdefghijklmnopqrstuvwxyz';
            if (chars.indexOf('A') > -1)
                mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            if (chars.indexOf('#') > -1)
                mask += '0123456789';
            if (chars.indexOf('!') > -1)
                mask += '~`!@#$%^&*()_+-={}[]:";\'<>?,./|\\';
            var result = '';
            for (var i = length; i > 0; --i)
                result += mask[Math.round(Math.random() * (mask.length - 1))];
            return result;
        };

        _this.getRawParameters = function (uri) {
            // This function is anonymous, is executed immediately and 
            // the return value is assigned to QueryString!
            var query_string = {}, query, parts;
            if (uri) {
                query = uri;
            } else {
                parts = window.location.href.split('?');
                if (parts.length > 1)
                    query = parts[1];
            }
            var parts = window.location.href.split('?');
            // GET variables present
            if (typeof query !== 'undefined') {
                var vars = query.split("&");
                for (var i = 0; i < vars.length; i++) {
                    var pair = vars[i].split("=");
                    // If first entry with this name
                    if (typeof query_string[pair[0]] === "undefined") {
                        query_string[pair[0]] = pair[1];
                        // If second entry with this name
                    } else if (typeof query_string[pair[0]] === "string") {
                        var arr = [query_string[pair[0]], pair[1]];
                        query_string[pair[0]] = arr;
                        // If third or later entry with this name
                    } else {
                        query_string[pair[0]].push(pair[1]);
                    }
                }
            } else {
                // GET variables not present
            }
            return query_string;
        };

        // Extensions on existing APIs        
        String.prototype.toCamelCase = function () {
            var field = this;
            var fc = field.charAt(0).toLowerCase();
            field = [fc, field.substring(1, field.length)].join('').replace(/[\s\t]+/gi, '');
            console.log('Camel case: %s', field);
            return field;
        };

        // Get parameter by name from current URL        
        _this.getParameterByName = function (name) {
            name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
            var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
                results = regex.exec(location.search);
            return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
        };

        // get parameter by name from argument URL (2nd argument)        
        this.getQueryString = function (field, url) {
            var href = url ? url : window.location.href;
            var reg = new RegExp('[?&]' + field + '=([^&#]*)', 'i');
            var string = reg.exec(href);
            return string ? string[1] : undefined;
        };

        this.debugMode = function () {
            return this.getQueryString('debug') !== undefined;
        }

        // tack on logger functionality
        this.log = function () {
            if (_this.debugMode()) {
                window.console.log.apply(null, arguments);
            }
        };
        this.info = function () {
            if (_this.debugMode()) {
                window.console.info.apply(null, arguments);
            }
        };
        this.warn = function () {
            if (_this.debugMode()) {
                window.console.warn.apply(null, arguments);
            }
        };
        this.error = function () {
            window.console.error.apply(null, arguments);
        };
        this.init = function () {
            _this.log('Debug? %s', this.getQueryString('debug') !== undefined);
            return _this;
        };
        //this.log('Debug? %s', this.getQueryString('debug') !== undefined);        
    }
    var n = new LarCity;
    n.init();
    return n;
}());


/*********************** ng-larcity-standalone.js ***********************/
angular.module('ng-larcity-standalone', [])
    .provider('$larcity', function LarcityTookitProvider() {

        var config = {}
            , Toolkit = function ($rootScope, LarcityToolkit, globalConfig) {
                // do stuff with the root scope
                var config = globalConfig;

                var _ = {
                    ToolKit: LarcityToolkit,
                    config: function () {
                        return config;
                    }
                    , log: console.log
                    , info: console.info
                    , error: console.error
                    , warn: console.warn
                }

                document.addEventListener('com:comenity:ready', function (event) {
                    _.ToolKit = event.detail;
                    // expose public API aliases via $larcity toolkit 
                    _.log = _.ToolKit.log;
                    _.info = _.ToolKit.info;
                    _.error = _.ToolKit.error;
                    _.warn = _.ToolKit.warn;
                    // announce ready (if in debug mode)
                    _.ToolKit.log('ComenityJS is ready! %o', event.detail);
                });

                return _;
            }
            ;

        // is this a promise? Will it wait for remote load of the library?
        this.$get = ["$rootScope", function comenityTookitFactory(scope) {
            var _this = this;
            // no comenity toolkit available at the time (will asynchronously load)
            return new Toolkit(scope, null, _this.config);
        }];

        // verify Comenity.js is present 
        if (typeof LarCity !== undefined) {
            // fire event 
            var event = new CustomEvent('com:larcity:ready', { 'detail': LarCity });
            document.dispatchEvent(event);
        } else
            console.error('larcity.js required, and not loaded!');

    });
/*********************** shared.js ***********************/
// Protect all demos requiring a gate login
angular.module("lng-services", [
    'service.data',
    'http-auth-interceptor',
    'ng-larcity-standalone',
    'angular-uuid'
])
    .factory('$authService', [
        '$rootScope', '$dataService', '$instanceStorage', '$larcity', '$location',
        function ($s, $data, $store, $larcity, $l) {
            console.log('[$authService]');

            // @TODO furnish a global login function - is this really necessary?       
            // furnish a global logout function            
            $s.logout = function () {
                $store.set('user', null);
                $store.set('credentials', null);
                // @TODO invalidate token via API
                $l.path('/login');
            };

            var _ = {
                authInfoExists: function () {
                    var credentials = $store.get('credentials');
                    return credentials !== null && credentials.accessToken;
                },
                userInfoExists: function () {
                    var user = $store.get('user');
                    return this.authInfoExists() && user !== null && user._id;
                },
                isAuthorized: function (scope) {
                    if (typeof scope === 'string') scope = scope.split(' ');
                    return new Promise(function (resolve, reject) {
                        //if (typeof scope !== 'array') return reject();
                        var credentials = $store.get('credentials');
                        if (!credentials) return reject('No credentials found');
                        // @TODO implement callback to check validity of token in stored credentials
                        //return reject();
                        return resolve(true);
                    })
                },
                saveCredentialsFromHTTPResponse: function (res) {
                    return new Promise(function (resolve, reject) {
                        console.warn('Authentication response @ $authService -> %o', res);
                        if (!res.data || !res.data.credentials) {
                            return reject('Owner or Credentials missing in auth response');
                        }
                        // save person's information and credentials
                        $store.set('user', res.data);
                        $store.set('credentials', res.data.credentials);
                        $data.set('User', res.data);
                        $data.set('credentials', res.data.credentials);
                        // callback
                        return resolve(res.data.credentials);
                    });
                }
            };
            // expose to controller
            $s.authHelper = _;
            // return for factory
            return _;
        }
    ])
    .run([
        '$rootScope', '$larcity', '$instanceStorage', '$location',
        function ($s, $larcity, $store, $l) {

            var captureCredentialsIfProvided = function () {
                return new Promise(function (resolve, reject) {
                    var credentials = $l.search();
                    //console.warn('Info -> %o', info);
                    /* // @TODO Might have to use this instead if IE tests don't work
                    var accessToken = $larcity.ToolKit.getQueryString('accessToken');
                    if (accessToken) {
                        var credentials = {
                            accessToken: accessToken,
                            timeCreated: parseInt($larcity.ToolKit.getQueryString('timeCreated')),
                            expiresInSeconds: parseInt($larcity.ToolKit.getQueryString('expiresInSeconds'))
                        };
                    };
                    */
                    if (credentials && credentials.accessToken) {
                        'timeCreated,expiresInSeconds'.split(',').forEach(function (f) {
                            if (credentials[f])
                                credentials[f] = parseInt(credentials[f]);
                        });
                        console.warn('Credentials -> %o', credentials);
                        $store.set('credentials', credentials);
                        // @TODO load the default path and clear any query string params
                        $l.url($l.path('/tests'));
                        if (!$s.$$phase) $s.$apply();
                    }
                });
            };

            document.addEventListener('com:larcity:ready', function () {
                captureCredentialsIfProvided();
            });
        }
    ])
    .factory('$accessShieldService', [
        '$rootScope', '$authService', '$location',
        function ($s, $auth, $location) {
            console.log('[$accessShieldService]');

            var _ = {
                requireAuthorization: function (scopes) {
                    $auth.isAuthorized(scopes || ['view'])
                        .then(function () {
                            console.info('Authorized');
                        })
                        .catch(function (err) {
                            console.error('Not authorized: %s', err);
                            // re-direct to login view
                            $location.path('/login');
                        });
                }
            };

            // Check to make sure user is authorized to view demo            
            _.requireAuthorization();

            return _;

        }
    ])
    // this is an alias for $demoShieldService
    .factory('$demoShield', function ($accessShieldService) {
        return $accessShieldService;
    })
    .factory('$dependencyManager', [
        '$rootScope', 'uuid', '$timeout',
        function ($all, $uuid, $timeout) {

            /** Manage dependencies */
            $all.$on('$routeChangeStart', function () {
                document.querySelectorAll('.dependency').forEach(function (el) {
                    if (el.parentNode) {
                        console.warn('Removing: %s', el.href || el.src || el.id);
                        el.parentNode.removeChild(el);
                    }
                });
            });

            $all.$on('$routeChangeSuccess', function () {
                $timeout(function () {
                    document.querySelectorAll('.ng-hide.has-dependency').forEach(function (el) {
                        angular.element(el).removeClass('ng-hide');
                    });
                }, 500, true);
            });

            var _ = {
                require: function (libs) {
                    if (!Array.isArray(libs)) {
                        return console.error('The require library ONLY accepts an array of style of js dependencies');
                    }
                    angular.forEach(libs, function (res) {
                        var onload, src;
                        if (res && typeof res !== 'string' && typeof res === 'object') {
                            onload = res.onload;
                            // finally, assign src to the URI
                            src = res.src || res.href;
                            if (onload)
                                console.warn('>>> Will run callback after loading: %s <<<', res.src);
                        } else
                            src = res;
                        if (/\.js$/.test(src)) {
                            var script = document.createElement('script');
                            script.type = 'text/javascript';
                            script.id = $uuid.v4();
                            script.src = src;
                            script.className = 'js dependency';
                            script.onload = function () {
                                var _t = this;
                                // @TODO make event name into a constant
                                var ev = new CustomEvent('script:loaded');
                                console.warn('Loaded: %s', _t.src);
                                _t.dispatchEvent(ev);
                                if (typeof onload === 'function') onload();
                            };
                            document.querySelector('head').appendChild(script);
                        } else if (/\.css$/.test(src)) {
                            var ln = document.createElement('link');
                            ln.rel = 'stylesheet';
                            ln.id = $uuid.v4();
                            ln.href = src;
                            ln.className = 'style dependency';
                            ln.onload = function () {
                                var _t = this;
                                // @TODO make event name into a constant
                                var ev = new CustomEvent('style:loaded');
                                console.warn('Loaded: %s', _t.href);
                                _t.dispatchEvent(ev);
                                if (typeof onload === 'function') onload();
                            };
                            document.querySelector('head').appendChild(ln);
                        }
                    });
                }
            };
            return _;
        }
    ])
    ;


