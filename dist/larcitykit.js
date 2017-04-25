/*********************** angular-uuid.js ***********************/
//    angular-uuid created by Ivan Hayes @munkychop
//    MIT License - http://opensource.org/licenses/mit-license.php
//    --------------------------------------------------------------
//    This is an AngularJS wrapper for the original node-uuid library
//    written by Robert Kieffer – https://github.com/broofa/node-uuid
//    MIT License - http://opensource.org/licenses/mit-license.php
//    The wrapped node-uuid library is at version 1.4.7

function AngularUUID () {
  'use strict';

  angular.module('angular-uuid',[]).factory('uuid', ['$window', nodeUUID]);

  function nodeUUID ($window) {
    // Unique ID creation requires a high quality random # generator.  We feature
    // detect to determine the best RNG source, normalizing to a function that
    // returns 128-bits of randomness, since that's what's usually required
    var _rng, _mathRNG, _whatwgRNG;

    // Allow for MSIE11 msCrypto
    var _crypto = $window.crypto || $window.msCrypto;

    if (!_rng && _crypto && _crypto.getRandomValues) {
      // WHATWG crypto-based RNG - http://wiki.whatwg.org/wiki/Crypto
      //
      // Moderately fast, high quality
      try {
        var _rnds8 = new Uint8Array(16);
        _whatwgRNG = _rng = function whatwgRNG() {
          _crypto.getRandomValues(_rnds8);
          return _rnds8;
        };
        _rng();
      } catch(e) {}
    }

    if (!_rng) {
      // Math.random()-based (RNG)
      //
      // If all else fails, use Math.random().  It's fast, but is of unspecified
      // quality.
      var  _rnds = new Array(16);
      _mathRNG = _rng = function() {
        for (var i = 0, r; i < 16; i++) {
          if ((i & 0x03) === 0) { r = Math.random() * 0x100000000; }
          _rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
        }

        return _rnds;
      };
      if ('undefined' !== typeof console && console.warn) {
        console.warn('[SECURITY] node-uuid: crypto not usable, falling back to insecure Math.random()');
      }
    }

    // Buffer class to use
    var BufferClass = ('function' === typeof Buffer) ? Buffer : Array;

    // Maps for number <-> hex string conversion
    var _byteToHex = [];
    var _hexToByte = {};
    for (var i = 0; i < 256; i++) {
      _byteToHex[i] = (i + 0x100).toString(16).substr(1);
      _hexToByte[_byteToHex[i]] = i;
    }

    // **`parse()` - Parse a UUID into it's component bytes**
    function parse(s, buf, offset) {
      var i = (buf && offset) || 0, ii = 0;

      buf = buf || [];
      s.toLowerCase().replace(/[0-9a-f]{2}/g, function(oct) {
        if (ii < 16) { // Don't overflow!
          buf[i + ii++] = _hexToByte[oct];
        }
      });

      // Zero out remaining bytes if string was short
      while (ii < 16) {
        buf[i + ii++] = 0;
      }

      return buf;
    }

    // **`unparse()` - Convert UUID byte array (ala parse()) into a string**
    function unparse(buf, offset) {
      var i = offset || 0, bth = _byteToHex;
      return  bth[buf[i++]] + bth[buf[i++]] +
              bth[buf[i++]] + bth[buf[i++]] + '-' +
              bth[buf[i++]] + bth[buf[i++]] + '-' +
              bth[buf[i++]] + bth[buf[i++]] + '-' +
              bth[buf[i++]] + bth[buf[i++]] + '-' +
              bth[buf[i++]] + bth[buf[i++]] +
              bth[buf[i++]] + bth[buf[i++]] +
              bth[buf[i++]] + bth[buf[i++]];
    }

    // **`v1()` - Generate time-based UUID**
    //
    // Inspired by https://github.com/LiosK/UUID.js
    // and http://docs.python.org/library/uuid.html

    // random #'s we need to init node and clockseq
    var _seedBytes = _rng();

    // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
    var _nodeId = [
      _seedBytes[0] | 0x01,
      _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]
    ];

    // Per 4.2.2, randomize (14 bit) clockseq
    var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;

    // Previous uuid creation time
    var _lastMSecs = 0, _lastNSecs = 0;

    // See https://github.com/broofa/node-uuid for API details
    function v1(options, buf, offset) {
      var i = buf && offset || 0;
      var b = buf || [];

      options = options || {};

      var clockseq = (options.clockseq != null) ? options.clockseq : _clockseq;

      // UUID timestamps are 100 nano-second units since the Gregorian epoch,
      // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
      // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
      // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
      var msecs = (options.msecs != null) ? options.msecs : new Date().getTime();

      // Per 4.2.1.2, use count of uuid's generated during the current clock
      // cycle to simulate higher resolution clock
      var nsecs = (options.nsecs != null) ? options.nsecs : _lastNSecs + 1;

      // Time since last uuid creation (in msecs)
      var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

      // Per 4.2.1.2, Bump clockseq on clock regression
      if (dt < 0 && options.clockseq == null) {
        clockseq = clockseq + 1 & 0x3fff;
      }

      // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
      // time interval
      if ((dt < 0 || msecs > _lastMSecs) && options.nsecs == null) {
        nsecs = 0;
      }

      // Per 4.2.1.2 Throw error if too many uuids are requested
      if (nsecs >= 10000) {
        throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
      }

      _lastMSecs = msecs;
      _lastNSecs = nsecs;
      _clockseq = clockseq;

      // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
      msecs += 12219292800000;

      // `time_low`
      var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
      b[i++] = tl >>> 24 & 0xff;
      b[i++] = tl >>> 16 & 0xff;
      b[i++] = tl >>> 8 & 0xff;
      b[i++] = tl & 0xff;

      // `time_mid`
      var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
      b[i++] = tmh >>> 8 & 0xff;
      b[i++] = tmh & 0xff;

      // `time_high_and_version`
      b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
      b[i++] = tmh >>> 16 & 0xff;

      // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
      b[i++] = clockseq >>> 8 | 0x80;

      // `clock_seq_low`
      b[i++] = clockseq & 0xff;

      // `node`
      var node = options.node || _nodeId;
      for (var n = 0; n < 6; n++) {
        b[i + n] = node[n];
      }

      return buf ? buf : unparse(b);
    }

    // **`v4()` - Generate random UUID**

    // See https://github.com/broofa/node-uuid for API details
    function v4(options, buf, offset) {
      // Deprecated - 'format' argument, as supported in v1.2
      var i = buf && offset || 0;

      if (typeof(options) === 'string') {
        buf = (options === 'binary') ? new BufferClass(16) : null;
        options = null;
      }
      options = options || {};

      var rnds = options.random || (options.rng || _rng)();

      // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
      rnds[6] = (rnds[6] & 0x0f) | 0x40;
      rnds[8] = (rnds[8] & 0x3f) | 0x80;

      // Copy bytes to buffer, if provided
      if (buf) {
        for (var ii = 0; ii < 16; ii++) {
          buf[i + ii] = rnds[ii];
        }
      }

      return buf || unparse(rnds);
    }

    // Export public API
    var uuid = v4;
    uuid.v1 = v1;
    uuid.v4 = v4;
    uuid.parse = parse;
    uuid.unparse = unparse;
    uuid.BufferClass = BufferClass;
    uuid._rng = _rng;
    uuid._mathRNG = _mathRNG;
    uuid._whatwgRNG = _whatwgRNG;

    return uuid;
  }
}

// check for Module/AMD support, otherwise call the uuid function to setup the angular module.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = new AngularUUID();

} else if (typeof define !== 'undefined' && define.amd) {
  // AMD. Register as an anonymous module.
  define (function() {
    return new AngularUUID();
  });
  
} else {
  AngularUUID();
}


/*********************** http-auth-interceptor.js ***********************/
/*global angular:true, browser:true */

/**
 * @license HTTP Auth Interceptor Module for AngularJS
 * (c) 2012 Witold Szczerba
 * License: MIT
 */
(function () {
  'use strict';

  angular.module('http-auth-interceptor', ['http-auth-interceptor-buffer'])

    .factory('authService', ['$rootScope', 'httpBuffer', function ($rootScope, httpBuffer) {
      return {
        /**
         * Call this function to indicate that authentication was successfull and trigger a
         * retry of all deferred requests.
         * @param data an optional argument to pass on to $emit which may be useful for
         * example if you need to pass through details of the user that was logged in
         */
        loginConfirmed: function (data, configUpdater) {
          var updater = configUpdater || function (config) { return config; };
          $rootScope.$emit('app:auth-loginConfirmed', data);
          httpBuffer.retryAll(updater);
        },

        /**
         * Call this function to indicate that authentication should not proceed.
         * All deferred requests will be abandoned or rejected (if reason is provided).
         * @param data an optional argument to pass on to $emit.
         * @param reason if provided, the requests are rejected; abandoned otherwise.
         */
        loginCancelled: function (data, reason) {
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
    .config(['$httpProvider', function ($httpProvider) {
      $httpProvider.interceptors.push(['$rootScope', '$q', 'httpBuffer', function ($rootScope, $q, httpBuffer) {
        return {
          responseError: function (rejection) {
            console.log("Rejection >>");
            console.log(rejection);
            /** @TODO handle no connection **/
            /** @TODO check origin domain of 401 error **/
            /*
            if (rejection.status === 401) {
              var deferred = $q.defer();
              httpBuffer.append(rejection.config, deferred);
              $rootScope.$emit('app:auth-loginRequired', rejection);
              return deferred.promise;
            }
            */
            switch (rejection.status) {
              case 401:
                var deferred = $q.defer();
                httpBuffer.append(rejection.config, deferred);
                $rootScope.$emit('app:auth-loginRequired', rejection);
                return deferred.promise;

              default:
                var deferred = $q.defer();
                httpBuffer.append(rejection.config, deferred);
                var eventName = 'app:auth-intercepted' + (rejection.status || '');
                $rootScope.$emit(eventName, rejection);
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

    .factory('httpBuffer', ['$injector', function ($injector) {
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
        append: function (config, deferred) {
          buffer.push({
            config: config,
            deferred: deferred
          });
        },

        /**
         * Abandon or reject (if reason provided) all the buffered requests.
         */
        rejectAll: function (reason) {
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
        retryAll: function (updater) {
          for (var i = 0; i < buffer.length; ++i) {
            retryHttpRequest(updater(buffer[i].config), buffer[i].deferred);
          }
          buffer = [];
        }
      };
    }]);
})();


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


/*********************** larcity.js ***********************/
var LarCity = (function () {
    function LarCity() {
        var _this = this;

        _this.Pathable = function (obj) {
            if (typeof obj !== 'object') return;
            // extend object         
            obj.readPath = function (path) {
                var obj = this;
                if (!Array.isArray(path)) path = path.split('.');
                for (var i = 0; i < path.length; i++) {
                    obj = obj[path[i]];
                }
                return obj;
            };
            return obj;
        };

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


