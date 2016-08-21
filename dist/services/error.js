angular.module('lngErrorService', [])
        .factory('$errorService', [
            '$rootScope', '$extensionService', '$sce',
            function ($rootScope, $ex, $sce) {
                $ex.log("[module.service.Error]");
                var Errors = {
                    messages: function () {
                        return this.fields;
                    },
                    message: function (key) {
                        var me = this;
                        if (me.fields[key])
                            return me.fields[key].message;
                    },
                    reset: function (key) {
                        var me = this;
                        if (!key) {
                            $rootScope.Errors.fields = {};
                        } else if (me.fields[key])
                            me.fields[key] = null;
                    },
                    getAllMessages: function () {
                        var errorMessages = [];
                        angular.forEach(this.fields, function (err, key) {
                            if (angular.isObject(err))
                                errorMessages.push("Error with <strong>" + key + "</strong>: " + err.message);
                        });
                        return errorMessages;
                    },
                    condensed: function (delimiter) {
                        if (!delimiter)
                            delimiter = ' // ';
                        return this.getAllMessages().join(delimiter);
                    },
                    fields: {},
                    clear: function () {
                        $rootScope.Errors.reset();
                    },
                    update: function (errors) {
                        if (angular.isObject(errors)) {
                            angular.extend(Errors.fields, errors);
                            // check for fields
                            angular.forEach(errors, function (err, key) {
                                var elem = angular.element("[name='" + key + "']");
                                if (elem.length) {
                                    // found element
                                    $ex.log(elem, "Found error element");
                                    elem.parent().append("<div class='form-error'>" + err.message + "</div>");
                                    elem.on('focus', function (ev) {
                                        $ex.log(arguments, 'Focus captured in Error listener!');
                                        var thisElem = angular.element(ev.target), Parent = thisElem.parent(), errorViews = Parent.find('.form-error');
                                        $ex.log(Parent, 'Element parent');
                                        $ex.log(errorViews, 'Error views for `' + key + '`');
                                        angular.forEach(errorViews, function (div) {
                                            div.remove();
                                        });
                                    });
                                }
                            });
                            $rootScope.Errors = Errors;
                            $ex.log(errors, 'Errors reported!');
                        }
                    }
                };
                $rootScope.Errors = Errors;
                return Errors;
            }]);