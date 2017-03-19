angular.module('lngX', [])
        .factory('$xService', ['$http', '$rootScope', '$location', function ($http, $rt, $urloc) {
                var options = {
                    namespace: 'APPLOG',
                    verbose: true,
                    stateClass: {
                        success: 'toast-success',
                        warning: 'toast-warning',
                        error: 'toast-error',
                        info: 'toast-info'
                    }
                };
                if (typeof (console) == "undefined") {
                    console = {};
                }
                if (typeof (console.log) == "undefined") {
                    console.log = function () {
                        return 0;
                    };
                };
                jQuery.support.placeholder = (function () {
                    var i = document.createElement('input');
                    return 'placeholder' in i;
                })();
                var alerts = [];
                var engn = {
                    getConfig: function () {
                        return options;
                    },
                    setVerbose: function (verbose) {
                        options.verbose = verbose;
                    },
                    setConfig: function (config) {
                        options = config;
                    },
                    validateURL: function (textval) {
                        var re = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/;
                        //var re = new RegExp(options.urlRegExp);
                        return re.test(textval);
                    },
                    validateEmail: function (email) {
                        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                        //var re = new RegExp(options.emailRegExp);
                        return re.test(email);
                    },
                    preview: function (text, previewMax) {
                        var showtext = text.substring(0, previewMax);
                        if (text.length > previewMax) {
                            showtext = showtext + "...";
                        }
                        return showtext;
                    },
                    isNumericKeyCode: function (keyCode, elem) {
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
                    },
                    randomString: function (length, chars) {
                        if(!chars) chars = 'aA#'; // default to alphabets (lower and upper case) and numbers
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
                    },
                    getRawParameters: function ( uri ) {
                        // This function is anonymous, is executed immediately and 
                        // the return value is assigned to QueryString!
                        var query_string = {}, query, parts;
                        if(uri) {
                            query=uri;
                        } else {
                            parts = window.location.href.split('?');
                            if(parts.length>1)
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
                    },
                    getParameterByName: function (name) {
                        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
                        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
                                results = regex.exec(location.search);
                        return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
                    },
                    log: function (obj, text) {
                        if (options.verbose) {
                            if (text) {
                                console.log(options.namespace + ':: ' + text + ' >> ');
                            }
                            if (obj) {
                                console.log(obj);
                            }
                        }
                    },
                    radioSilence: function () {
                        options.verbose = false;
                    },
                    getDOMId: function (prefix) {
                        var id, numid;
                        do {
                            if (prefix) {
                                numid = Math.floor(Math.random() * 100000);
                                id = prefix + numid;
                            }
                            else {
                                numid = Math.floor(Math.random() * 1000000);
                                id = numid;
                            }
                        } while ($('#' + id).length > 0);
                        return id;
                    },
                    make: function (elemType) {
                        return document.createElement(elemType);
                    },
                    showBusy: function (txt, type) {
                        return {type: type, message: txt, class: '', is_error: /error/.test(type)};
                    },
                    clearBusy: function () {
                    },
                    closeAlert: function (index) {
                        alerts.splice(index, 1);
                        return alerts;
                    },
                    addAlert: function (alert) {
                        alerts.push(alert);
                        $rt.$emit('showAlerts', alerts);
                        return alerts;
                    },
                    updateAlerts: function (updatedAlerts) {
                        alerts = updatedAlerts;
                    },
                    getAlerts: function () {
                        return alerts;
                    },
                    clearAlerts: function () {
                        alerts = [];
                        return alerts;
                    },
                    setAlert: function (alert) {
                        alerts = [];
                        return engn.addAlert(alert);
                    },
                    pushAll: function (arr, arr2) {
                        Array.prototype.push.apply(arr, arr2);
                        return arr;
                    },
                    filterBytes: function (bytes, precision) {
                        if (isNaN(parseFloat(bytes)) || !isFinite(bytes))
                            return '-';
                        if (typeof precision === 'undefined')
                            precision = 1;
                        var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
                                number = Math.floor(Math.log(bytes) / Math.log(1024));
                        return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) + ' ' + units[number];
                    },
                    showToast: function () {
                        // cancel removal of toast
                        clearTimeout(engn.killToast);
                        var html = arguments[0];
                        var opts = {
                            css: options.toastCSS,
                            recycle: true,
                            position: null,
                            draggable: false,
                            callback: null,
                            trivial: false,
                            hide_close: false,
                            busy: false,
                            show_countdown: false,
                            interval: 1200,
                            timeout: 4800
                        };
                        if (arguments[1]) {
                            opts = $.extend(opts, arguments[1]);
                        }
                        if (opts.recycle)
                            $('.toast').remove();
                        engn.log(html, "Show toast message:");
                        // check for existing toast frame
                        if ($(".toast-frame").length > 0) {
                            var toastFrame = $(".toast-frame").first();
                            engn.log(toastFrame, "Found toastframe->");
                        } else {
                            var toastFrame = document.createElement('div');
                            toastFrame.id = engn.getDOMId("toastframe-");
                            toastFrame = $(toastFrame);
                            toastFrame.addClass('toast-frame');
                        }
                        toastFrame.addClass('wiap-ui-engine-toast');
                        var toast = document.createElement('div');
                        newid = engn.getDOMId("toast-");
                        toast.id = newid;
                        toast = $(toast);
                        toast.addClass("toast");
                        if (opts.has_error) {
                            toast.addClass("error");
                        } else if (opts.state && options.stateClass && options.stateClass[opts.state]) {
                            toast.addClass(options.stateClass[opts.state]);
                        } else if(opts.state) {
                            toast.addClass(opts.state);
                        }
                        if (!opts.hide_close) {
                            toast.append("<a href='#' class='close-toast'><b class='fa fa-times'></b></a>");
                        }
                        if (opts.busy) {
                            toast.append("<i class=\"fa fa-circle-o-notch fa-spin\"></i> ");
                        }
                        toast.append(html);
                        toastFrame.append(toast);
                        $('body').append(toastFrame);
                        /*
                        // animate toast frame
                        if (opts.has_error)
                            $(".toast-frame").effect("shake", {}, 500);
                        else
                            $(".toast-frame").effect("fadeIn", {}, 500);
                        */
                        engn.log(toast);
                        // find instance of toast appended to body
                        toast = $('#' + newid);
                        toast.find('.close-toast').bind('click', function (e) {
                            e.preventDefault();
                            // var toast = $(this);
                            engn.closeToast(toast);
                            /*
                             toast.fadeOut(250, function () {
                             // toastFrame.remove();
                             engn.clearToast();
                             });
                             */
                        });
                        if (opts.position) {
                            try {
                                toast.position(opts.position);
                            } catch (ex) {
                                engn.log(null, "Invalid position option for toast.");
                            }
                        }
                        if (opts.css) {
                            toast.css(opts.css);
                        }
                        if (opts.draggable) {
                            toast.draggable();
                        }
                        if (opts.trivial) {
                            if(opts.show_countdown)
                                toast.append("<div style='text-align:center;font-size:0.75em;'>This notice will clear in <span id='toast-counter'>" + parseInt(opts.timeout / opts.interval) + "</span>...</div>");
                            var timekeep = 0;
                            engn.killToastCheck = setInterval(function () {
                                timekeep += opts.interval;
                                if (timekeep >= opts.timeout) {
                                    clearInterval(engn.killToastCheck);
                                    engn.clearToast();
                                    if (angular.isFunction(opts.callback)) {
                                        opts.callback();
                                    }
                                } else {
                                    counter = toast.find("#toast-counter");
                                    if (!counter.is(":visible")) {
                                        counter.css({
                                            opacity: 1,
                                            filter: "alpha(opacity=100)"
                                        });
                                    }
                                    counter.html(parseInt((opts.timeout - timekeep) / opts.interval));
                                }
                            }, opts.interval);
                        } else {
                            if (opts.callback) {
                                try {
                                    if (angular.isFunction(opts.callback))
                                        opts.callback();
                                } catch (ex) {
                                    engn.log(null, "Failed to run callback of toast.");
                                }
                            }
                        }
                    },
                    closeToast: function (toast) {
                        clearInterval(engn.killToastCheck);
                        toast.fadeOut(250, function () {
                            var parent = toast.parents(".toast-frame");
                            if (parent.find(".toast").length == 0) {
                                parent.remove();
                            }
                            var effectsTrash = $(".ui-effects-wrapper");
                            if (effectsTrash.length > 0)
                                effectsTrash.remove();
                        });
                    },
                    clearToast: function () {
                        clearInterval(engn.killToastCheck);
                        $('.toast').fadeOut(250, function () {
                            $('.toast-frame').remove();
                        });
                        var effectsTrash = $(".ui-effects-wrapper");
                        if (effectsTrash.length > 0)
                            effectsTrash.remove();
                    },
                    newWindow: function () {
                        var w = $(window).width();
                        var minW = 450;
                        var dialogH = 600;
                        var dialogW = Math.min.apply(null, [minW, w]);
                        var margins = w - dialogW;
                        var margin = margins > 20 ? (margins / 2) : 10;
                        var opts = {
                            url: null,
                            width: dialogW,
                            height: dialogH,
                            marginTop: 100,
                            marginLeft: margin,
                            windowTitle: "New Window"
                        };
                        opts = arguments.length > 0 ? $.extend(opts, arguments[0]) : opts;
                        if (!opts.url) {
                            engine.showToast("Dev: You must provide a URL", {has_error: true, trivial: false});
                        }
                        var params = ["toolbar=no", "location=no", "menubar=no", "resizable=yes", "width=" + opts.width + "px", "height=" + opts.height + "px", "top=" + opts.marginTop, "left=" + opts.marginLeft];
                        return window.open(opts.url, opts.windowTitle, params.join(","));
                    },
                    getSettings: function () {
                        return options;
                    },
                    addGoogleMapsLib: function (callback) {
                        var me = this;
                        if (angular.isFunction(callback))
                            googleMapsCallback = callback;
                        else
                            googleMapsCallback = function () {
                                me.log("Google maps api custom load listener fired!");
                                $rt.$emit('app:googleMapsApiHasLoaded');
                            };
                        var loadlib = function () {
                            me.log($('#GoogleMapsAPI').length, 'Google Maps API exists');
                            if (typeof google === "undefined") {
                                var maplib = document.createElement('script');
                                maplib.id = 'GoogleMapsAPI';
                                maplib.type = 'text/javascript';
                                var libsrc = 'https://maps.googleapis.com/maps/api/js?' + $.param({
                                    key: 'AIzaSyAtTRtfO4j6b7vnDgs9tpZVOny2Sv-ezds',
                                    libraries: 'places',
                                    v: '3.exp',
                                    sensor: 'false',
                                    callback: 'googleMapsCallback'
                                });
                                me.log(libsrc, 'Google Maps Library GET');
                                //maplib.src = libsrc;
                                maplib.setAttribute('src', libsrc);
                                document.body.appendChild(maplib);
                                $rt.GOOGLE_MAPS_LOADED = true;
                                me.log("Loading Google Maps JS API...");
                            } else {
                                me.log("Google Maps API already loaded");
                                if (angular.isFunction(callback)) {
                                    callback();
                                }
                            }
                        };
                        if ($(window)) {
                            loadlib();
                        } else {
                            $(window).on('load', function () {
                                loadlib();
                            });
                        }
                    },
                    previewText: function (text, limit) {
                        if (!text) {
                            return false;
                        }
                        if (text.length > (limit)) {
                            return text.substring(0, limit) + "...";
                        } else {
                            return text;
                        }
                    },
                    syntaxHighlight: function (json) {
                        if (typeof json != 'string') {
                            json = JSON.stringify(json, undefined, 2);
                        }
                        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
                            var cls = 'number';
                            if (/^"/.test(match)) {
                                if (/:$/.test(match)) {
                                    cls = 'key';
                                } else {
                                    cls = 'string';
                                }
                            } else if (/true|false/.test(match)) {
                                cls = 'boolean';
                            } else if (/null/.test(match)) {
                                cls = 'null';
                            }
                            return '<span class="' + cls + '">' + match + '</span>';
                        });
                    },
                    bytes: function (bytes, precision) {
                        if (isNaN(parseFloat(bytes)) || !isFinite(bytes))
                            return '-';
                        if (typeof precision === 'undefined')
                            precision = 1;
                        var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
                                number = Math.floor(Math.log(bytes) / Math.log(1024));
                        return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) + ' ' + units[number];
                    },
                    toSlug: function (str) {
                        return str.replace(/[^a-z0-9]+/gi, '-').replace(/^-*|-*$/g, '').toLowerCase();
                    },
                    cssToObject: function (css_string) {
                        var cssParts = css_string.split(";");
                        var css = {};
                        angular.forEach(cssParts, function (part) {
                            part = part.trim();
                            if (part) {
                                var diss = part.split(":");
                                var keyParts = diss[0].split("-");
                                var key = "";
                                angular.forEach(keyParts, function (kpart, index) {
                                    if (index > 0) {
                                        kpart = kpart.charAt(0).toUpperCase() + kpart.slice(1);
                                    }
                                    key += kpart;
                                });
                                //$scope.OpenSection.css[diss[0] + ""] = diss[1] + "";
                                css[key] = diss[1].trim() + "";
                            }
                        });
                        return css;
                    },
                    toHTTPS: function (link) {
                        if (link)
                            return link.replace('http:', 'https:');
                    },
                    toHTTP: function (link) {
                        if (link)
                            return link.replace('https:', 'http:');
                    }
                };
                
                $rt.matches = function(a, b) {
                    return angular.equals(a,b);
                };
                
                engn.log('[module.service.X]');
                return engn;
            }]);