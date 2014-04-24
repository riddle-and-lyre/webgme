/*
 * Copyright (C) 2014 Vanderbilt University, All rights reserved.
 *
 * Author: Zsolt Lattmann
 *
 * Server side BLOB client implementation.
 */

define(['blob/BlobClient', 'http', 'https'],
    function (BlobClient, http, https) {

        /**
         * Initializes a new instance of a server side file system object.
         *
         * Note: This code strictly runs in node.js (server side).
         *
         * @param {{}} parameters
         * @constructor
         */
        function BlobServerClient(parameters) {
            BlobClient.call(this);
            //console.log(webGMEGlobal.getConfig());
            this.serverPort = parameters.serverPort;
        }

        // Inherits from BlobClient
        BlobServerClient.prototype = Object.create(BlobClient.prototype);

        // Override the constructor with this object's constructor
        BlobServerClient.prototype.constructor = BlobServerClient;

        BlobServerClient.prototype.getInfo = function (hash, callback) {
            var options = {
                hostname: '127.0.0.1',
                port: this.serverPort,
                path: this.getInfoURL(hash),
                method: 'GET'
            };

            this._sendHttpRequest(options, function (err, data) {
                if (err) {
                    callback(err);
                    return;
                }
                callback(null, JSON.parse(data));
            });
        };

        BlobServerClient.prototype.getObject = function (hash, callback) {
            var options = {
                hostname: '127.0.0.1',
                port: this.serverPort,
                path: this.getViewURL(hash),
                method: 'GET'
            };

            this._sendHttpRequest(options, function (err, data) {
                if (err) {
                    callback(err);
                    return;
                }
                callback(null, data);
            });
        };


        BlobServerClient.prototype.addComplexObject = function (complexObjectDescriptor, callback) {
            var fnames = Object.keys(complexObjectDescriptor.content);
            fnames.sort();

            var metadata = {
                name: complexObjectDescriptor.name,
                size: complexObjectDescriptor.size,
                mime: complexObjectDescriptor.mime,
                content: {},
                contentType: complexObjectDescriptor.contentType
            };

            if (complexObjectDescriptor.contentType === 'complex') {
                for (var j = 0; j < fnames.length; j += 1) {
                    metadata.content[fnames[j]] = complexObjectDescriptor.content[fnames[j]];
                }
            } else {
                callback('not supported metadata type');
                return;
            }

            var options = {
                hostname: '127.0.0.1',
                port: this.serverPort,
                path: this.getCreateURL(name, true),
                method: 'POST'
            };

            this._sendHttpRequestWithContent(options, JSON.stringify(metadata, null, 4), function (err, data) {
                if (err) {
                    callback(err);
                    return;
                }

                var response = JSON.parse(data);
                // TODO: handle error
                // Get the first one
                var hash = Object.keys(response)[0];
                callback(null, hash);
            });
        };


        BlobServerClient.prototype.addObject = function (name, data, callback) {
            var options = {
                hostname: '127.0.0.1',
                port: this.serverPort,
                path: this.getCreateURL(name),
                method: 'POST'
            };

            this._sendHttpRequestWithContent(options, data, function (err, responseData) {
                if (err) {
                    callback(err);
                    return;
                }

                var response = JSON.parse(responseData);
                // TODO: handle error
                // Get the first one
                var hash = Object.keys(response)[0];
                callback(null, hash);
            });
        };


        BlobServerClient.prototype._sendHttpRequest = function (options, callback) {
            // TODO: use the http or https
            var req = http.request(options, function(res) {
                var d = '';
                res.on('data', function (chunk) {
                    d += chunk;
                });

                res.on('end', function () {
                    if (res.statusCode === 200) {
                        callback(null, d);
                    } else {
                        callback(res.statusCode, d);
                    }
                });
            });

            req.on('error', function(e) {
                callback(e);
            });

            req.end();
        };


        BlobServerClient.prototype._sendHttpRequestWithContent = function (options, data, callback) {
            // TODO: use the http or https
            var req = http.request(options, function(res) {
            //    console.log('STATUS: ' + res.statusCode);
            //    console.log('HEADERS: ' + JSON.stringify(res.headers));
            //    res.setEncoding('utf8');
                var d = '';
                res.on('data', function (chunk) {
                    d += chunk;
                });

                res.on('end', function () {
                    if (res.statusCode === 200) {
                        callback(null, d);
                    } else {
                        callback(res.statusCode, d);
                    }
                });
            });

            req.on('error', function(e) {
                callback(e);
            });

            // write data to request body
            req.write(data);

            req.end();
        };

        return BlobServerClient;
    });
