var ozpIwc = ozpIwc || {};

/**
 * @module ozpIwc
 * @submodule ozpIwc.util
 */

/**
 * @class util
 * @namespace ozpIwc
 * @static
 */
ozpIwc.util = (function (log, util) {

    /**
     * Sends an AJAX request. A promise is returned to handle the response.
     *
     * @method ajax
     * @namespace ozpIwc.util
     * @static
     * @param {Object} config
     * @param {String} config.method
     * @param {String} config.href
     * @param [Object] config.headers
     * @param {String} config.headers.name
     * @param {String} config.headers.value
     * @param {boolean} config.withCredentials
     *
     * @return {Promise}
     */
    util.ajax = function (config) {
        return new Promise(function (resolve, reject) {
            var writeMethods = ["PUT", "POST", "PATCH"];
            var request = new XMLHttpRequest();
            request.open(config.method, config.href, true);
            request.withCredentials = true;
            var setContentType = true;
            if (Array.isArray(config.headers)) {
                config.headers.forEach(function (header) {
                    if (header.name === "Content-Type") {
                        setContentType = false;
                    }
                    request.setRequestHeader(header.name, header.value);
                });
            }
            //IE9 does not default the Content-Type. Set it if it wasn't passed in.
            if (writeMethods.indexOf(config.method) >= 0 && setContentType) {
                request.setRequestHeader("Content-Type", "text/plain;charset=UTF-8");
            }

            /*
             /*
             * Setting username and password as params to open() (and setting request.withCredentials = true)
             * per the API does not work in FF. setting them explicitly in the Authorization header works
             * (but only for BASIC authentication as coded here). If the credentials are set in the open command,
             * FF will fail to make the request, even though the credentials are manually set in the Authorization header
             * */

            request.onload = function () {
                if (Math.floor(this.status / 100) === 2) {
                    var entity;
                    try {
                        entity = JSON.parse(this.responseText);
                    } catch (e) {
                        entity = this.reponseText || this.responseXML;
                    }

                    log.info("[AJAX] [" + config.method + "] [" + config.href + "] [RESOLVE]");
                    resolve({
                        "response": entity,
                        "header": util.ajaxResponseHeaderToJSON(this.getAllResponseHeaders()),
                        'url': this.responseURL
                    });
                } else {
                    log.info("[AJAX] [" + config.method + "] [" + config.href + "] [REJECT] (" + this.status + ")");
                    reject(this);
                }
            };

            request.ontimeout = function (e) {
                log.info("[AJAX] [" + config.method + "] [" + config.href + "] [REJECT] (" + e + ")");
                reject(this);
            };

            request.onerror = function (e) {
                log.info("[AJAX] [" + config.method + "] [" + config.href + "] [REJECT] (" + e + ")");
                reject(this);
            };

            log.info("[AJAX] [" + config.method + "] [" + config.href + "]");
            try {
                if ((config.method === "POST") || (config.method === "PUT")) {
                    request.send(config.data);
                }
                else {
                    request.send();
                }
            } catch (e) {
                reject(e);
            }
        });
    };


    /**
     * Takes the Javascript ajax response header (string) and converts it to JSON
     * @method ajaxResponseHeaderToJSON
     * @param {String} header
     *
     * @return {Object}
     */
    util.ajaxResponseHeaderToJSON = function (header) {
        var obj = {};
        header.split("\n").forEach(function (property) {
            var kv = property.split(":");
            if (kv.length === 2) {
                obj[kv[0].trim()] = kv[1].trim();
            }
        });

        return obj;
    };

    return util;
}(ozpIwc.log, ozpIwc.util || {}));