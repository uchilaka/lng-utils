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