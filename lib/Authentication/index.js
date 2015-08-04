"use strict";

var handlers = {};

module.exports.register = function (constructor) {
    handlers[constructor.prototype.name] = constructor;
};

module.exports.get = function (name) {
    return handlers[name];
};