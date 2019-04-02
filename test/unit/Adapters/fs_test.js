'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

describe('fs adapter', () => {
    let fs, readFile, writeFile;

    beforeEach('create fakes', () => {
        readFile = td.function();
        writeFile = td.function();

        td.replace('fs', { readFile, writeFile });

        fs = require('../../../lib/Adapters/fs');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('readFile()', () => {
        it('fails if an error is returned in the native API callback', () => {
            const error = new Error('foo');

            td.when(readFile('bar', td.matchers.anything())).thenCallback(error);

            return fs.readFile('bar')
                .then(() => expect.fail())
                .catch(err => expect(err).to.deep.equal(error));
        });

        it('succeeds with the value returned on the native API callback', () => {
            const expected = { foo: 'bar' };

            td.when(readFile('bar', td.matchers.anything())).thenCallback(null, expected);

            return fs.readFile('bar')
                .then(actual => expect(actual).to.deep.equal(expected));
        });

        it('uses the default options', () => {
            const expected = { foo: 'bar' };

            td.when(readFile('bar', { encoding: null, flag: 'r' })).thenCallback(null, expected);

            return fs.readFile('bar')
                .then(actual => expect(actual).to.deep.equal(expected));
        });

        it('is able to use a specific encoding', () => {
            const expected = { foo: 'bar' };

            td.when(readFile('bar', 'utf8')).thenCallback(null, expected);

            return fs.readFile('bar', 'utf8')
                .then(actual => expect(actual).to.deep.equal(expected));
        });

        it('is able to override the default options', () => {
            const expected = { foo: 'bar' };

            td.when(readFile('bar', { encoding: 'utf8', flag: 'r' })).thenCallback(null, expected);

            return fs.readFile('bar', { encoding: 'utf8', flag: 'r' })
                .then(actual => expect(actual).to.deep.equal(expected));
        });
    });

    context('writeFile()', () => {
        it('fails if an error is returned in the native API callback', () => {
            const error = new Error('foo');

            td.when(writeFile('bar', 'baz', td.matchers.anything())).thenCallback(error);

            return fs.writeFile('bar', 'baz')
                .then(() => expect.fail())
                .catch(err => expect(err).to.deep.equal(error));
        });

        it('succeeds with the value returned on the native API callback', () => {
            td.when(writeFile('foo', 'bar', td.matchers.anything())).thenCallback();

            return fs.writeFile('foo', 'bar');
        });

        it('uses the default options', () => {
            td.when(writeFile('foo', 'bar', { encoding: 'utf8', mode: 0o666, flag: 'w' })).thenCallback();

            return fs.writeFile('foo', 'bar');
        });

        it('is able to use a specific encoding', () => {
            td.when(writeFile('foo', 'bar', 'utf8')).thenCallback();

            return fs.writeFile('foo', 'bar', 'utf8');
        });

        it('is able to override the default options', () => {
            td.when(writeFile('foo', 'bar', { encoding: 'ascii', mode: 0o666, flag: 'w' })).thenCallback();

            return fs.writeFile('foo', 'bar', { encoding: 'ascii' });
        });
    });
});
