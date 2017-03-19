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
                    // expose public API aliases via $comenity toolkit 
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
