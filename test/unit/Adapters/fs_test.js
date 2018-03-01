'use strict';

/* eslint-env node, mocha */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const proxyquire = require('proxyquire');
const td = require('testdouble');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('fs adapter', () => {
    let fs, readFile, writeFile;

    beforeEach('create fakes', () => {
        readFile = td.function();
        writeFile = td.function();

        fs = proxyquire('lib/Adapters/fs', { fs: { readFile, writeFile } });
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('readFile()', () => {
        it('should fail if an error is returned in the native API callback', () => {
            const error = new Error('foo');

            td.when(readFile('bar', td.matchers.anything())).thenCallback(error);

            return expect(fs.readFile('bar')).to.be.rejected.then(err => expect(err).to.deep.equal(error));
        });

        it('should succeed with the value returned on the native API callback', () => {
            const expected = { foo: 'bar' };

            td.when(readFile('bar', td.matchers.anything())).thenCallback(null, expected);

            return expect(fs.readFile('bar')).to.be.fulfilled.then(actual => expect(actual).to.deep.equal(expected));
        });

        it('should use the default options', () => {
            const expected = { foo: 'bar' };

            td.when(readFile('bar', { encoding: null, flag: 'r' })).thenCallback(null, expected);

            return expect(fs.readFile('bar')).to.be.fulfilled.then(actual => expect(actual).to.deep.equal(expected));
        });

        it('should be able to use a specific encoding', () => {
            const expected = { foo: 'bar' };

            td.when(readFile('bar', 'utf8')).thenCallback(null, expected);

            return expect(fs.readFile('bar', 'utf8')).to.be.fulfilled.then(actual => expect(actual).to.deep.equal(expected));
        });

        it('should be able to override the default options', () => {
            const expected = { foo: 'bar' };

            td.when(readFile('bar', { encoding: 'utf8', flag: 'r' })).thenCallback(null, expected);

            return expect(fs.readFile('bar', { encoding: 'utf8', flag: 'r' })).to.be.fulfilled.then(actual => expect(actual).to.deep.equal(expected));
        });
    });

    context('writeFile()', () => {
        it('should fail if an error is returned in the native API callback', () => {
            const error = new Error('foo');

            td.when(writeFile('bar', 'baz', td.matchers.anything())).thenCallback(error);

            return expect(fs.writeFile('bar', 'baz')).to.be.rejected.then(err => expect(err).to.deep.equal(error));
        });

        it('should succeed with the value returned on the native API callback', () => {
            td.when(writeFile('foo', 'bar', td.matchers.anything())).thenCallback();

            return expect(fs.writeFile('foo', 'bar')).to.be.fulfilled;
        });

        it('should use the default options', () => {
            td.when(writeFile('foo', 'bar', { encoding: 'utf8', mode: 0o666, flag: 'w' })).thenCallback();

            return expect(fs.writeFile('foo', 'bar')).to.be.fulfilled;
        });

        it('should be able to use a specific encoding', () => {
            td.when(writeFile('foo', 'bar', 'utf8')).thenCallback();

            return expect(fs.writeFile('foo', 'bar', 'utf8')).to.be.fulfilled;
        });

        it('should be able to override the default options', () => {
            td.when(writeFile('foo', 'bar', { encoding: 'ascii', mode: 0o666, flag: 'w' })).thenCallback();

            return expect(fs.writeFile('foo', 'bar', { encoding: 'ascii' })).to.be.fulfilled;
        });
    });
});
