angular.module('lngErrorService', [
    'lngX'
]).factory('$errorService', [
    '$rootScope', '$xService', '$sce',
    function ($rootScope, $ex, $sce) {
        $ex.log("[module.service.Error]");

        var parentClass = 'field';
        var parentErrorClass = 'error';
        var errorDetailClass = 'form-error';

        var Errors = {
            messages: function () {
                return this.fields;
            },
            setFieldFrameClass: function (frameClass) {
                parentClass = frameClass;
            },
            setFrameErrorClass: function (errorClass) {
                parentErrorClass = errorClass;
            },
            setErrorDetailClass: function (errorClass) {
                errorDetailClass = errorClass;
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
                // @TODO clear all fields at the same time
                angular.forEach(Errors.fields, function (err, key) {
                    var elem = angular.element("[name='" + key + "']");
                    if (elem.length) {
                        // found element
                        $ex.log(elem, "Found error element");
                        var Parent = elem.parents('.' + parentClass);
                        // @TODO test Parent.length as way to verify element(s) exist
                        if (Parent.length) {
                            var ErrorDiv = Parent.find('.form-error');
                            if(ErrorDiv.length) {
                                console.log('Found error to reset -> ', ErrorDiv);
                                //Parent.removeChild(ErrorDiv);
                                try {
                                    ErrorDiv.remove();
                                } catch(err) {
                                    console.error('Error div clearing failed');
                                }
                            } 
                        }
                    }
                });
                //$rootScope.Errors.reset();
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
                            var Parent = elem.parents('.' + parentClass),
                                msgHtml = "<div class='form-error'>" + err.message + "</div>";
                            // @TODO test Parent.length as way to verify element(s) exist
                            if (Parent.length) {
                                Parent.addClass(parentErrorClass);
                                Parent.append(msgHtml);
                            } else
                                elem.parent().append(msgHtml);
                            // setup focus to clear error
                            elem.on('focus', function (ev) {
                                $ex.log(arguments, 'Focus captured in Error listener!');
                                var thisElem = angular.element(ev.target),
                                    Parent = thisElem.parents('.' + parentClass),
                                    errorViews = Parent.find('.form-error');
                                $ex.log(Parent, 'Element parent');
                                // remove error class from parent 
                                Parent.removeClass(parentErrorClass);
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