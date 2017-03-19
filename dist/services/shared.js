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