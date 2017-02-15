var LarCity = (function () {
    function LarCity() {
        this.getQueryString = function (field, url) {
            var href = url ? url : window.location.href;
            var reg = new RegExp('[?&]' + field + '=([^&#]*)', 'i');
            var string = reg.exec(href);
            return string ? string[1] : undefined;
        };
        this.debugMode = function () {
            return this.getQueryString('debug') !== undefined;
        }
        this.log = function () {
            if (this.debugMode()) {
                console.log.apply(null, arguments);
            }
        };
        console.log('Debug? %s', this.getQueryString('debug') !== undefined);
    }
    return new LarCity;
}());