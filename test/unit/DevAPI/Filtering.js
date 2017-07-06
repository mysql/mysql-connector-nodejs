'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const filtering = require('lib/DevAPI/Filtering');
const expect = require('chai').expect;

describe('filtering', () => {
    it('should update and retrieve the state', () => {
        const criteria = 'foo = "bar"';
        const operation = filtering().setCriteria(criteria);

        return expect(operation.getCriteria()).to.equal(criteria);
    });
});
