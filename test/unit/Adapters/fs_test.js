'use strict';

/* eslint-env node, mocha */

const proxyquire = require('proxyquire');
const expect = require('chai').expect;
const td = require('testdouble');

describe('fs adapter', () => {
    let fs, readFile;

    beforeEach('create fakes', () => {
        readFile = td.function();
        fs = proxyquire('lib/Adapters/fs', { fs: { readFile } });
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('readFile()', () => {
        it('should fail if an error is returned in the native API callback', () => {
            const error = new Error('foo');

            td.when(readFile('bar', td.matchers.anything())).thenCallback(error);

            return fs.readFile('bar').catch(err => expect(err).to.deep.equal(error));
        });

        it('should succeed with the value returned on the native API callback', () => {
            const expected = { foo: 'bar' };

            td.when(readFile('bar', td.matchers.anything())).thenCallback(null, expected);

            return fs.readFile('bar').then(actual => expect(actual).to.deep.equal(expected));
        });

        it('should use the default options', () => {
            const expected = { foo: 'bar' };

            td.when(readFile('bar', { encoding: null, flag: 'r' })).thenCallback(null, expected);

            return fs.readFile('bar').then(actual => expect(actual).to.deep.equal(expected));
        });

        it('should be able to use a specific encoding', () => {
            const expected = { foo: 'bar' };

            td.when(readFile('bar', 'utf8')).thenCallback(null, expected);

            return fs.readFile('bar', 'utf8').then(actual => expect(actual).to.deep.equal(expected));
        });

        it('should be able to override the default options', () => {
            const expected = { foo: 'bar' };

            td.when(readFile('bar', { encoding: 'utf8', flag: 'r' })).thenCallback(null, expected);

            return fs.readFile('bar', { encoding: 'utf8', flag: 'r' }).then(actual => expect(actual).to.deep.equal(expected));
        });
    });
});
