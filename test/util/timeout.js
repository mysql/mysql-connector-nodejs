'use strict';

module.exports = function (promise, timeout) {
    const error = new Error();
    error.name = 'TimeoutError';

    return new Promise((resolve, reject) => {
        setTimeout(() => reject(error), timeout);

        return promise;
    });
};
