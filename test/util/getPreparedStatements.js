'use strict';

const getPreparedStatement = require('./getPreparedStatement');

module.exports = function (session, ids) {
    return Promise.all(ids.map(id => getPreparedStatement(session, id)))
        .then(result => result.filter(value => typeof value !== 'undefined'));
};
