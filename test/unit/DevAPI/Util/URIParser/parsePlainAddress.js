'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const parsePlainAddress = require('../../../../../lib/DevAPI/Util/URIParser/parsePlainAddress');

describe('parsePlainAddress', () => {
    it('parses a full valid IPv6 address', () => {
        expect(parsePlainAddress('[2001:0db8:85a3:0000:0000:8a2e:0370:7334]:33060')).to.deep.equal({ host: '2001:0db8:85a3:0000:0000:8a2e:0370:7334', port: 33060, socket: undefined });
    });

    it('parses an IPv6 address without a port', () => {
        expect(parsePlainAddress('[::]')).to.deep.equal({ host: '::', port: undefined, socket: undefined });
    });

    it('parses a full valid IPv4 address', () => {
        expect(parsePlainAddress('127.0.0.1:33060')).to.deep.equal({ host: '127.0.0.1', port: 33060, socket: undefined });
    });

    it('parses a valid IPv4 address without a port', () => {
        expect(parsePlainAddress('0.0.0.0')).to.deep.equal({ host: '0.0.0.0', port: undefined, socket: undefined });
    });

    it('parses a valid full common name address', () => {
        expect(parsePlainAddress('prod-01.example.com:33060')).to.deep.equal({ host: 'prod-01.example.com', port: 33060, socket: undefined });
    });

    it('parses a valid common name address without a port', () => {
        expect(parsePlainAddress('localhost')).to.deep.equal({ host: 'localhost', port: undefined, socket: undefined });
    });

    it('throws an error if the address is not valid', () => {
        ['prod 01.example.com', '[01:23:45:67:89:ab]'].forEach(invalid => {
            expect(() => parsePlainAddress(invalid)).to.throw('Invalid URI');
        });
    });

    it('parses a valid pct-encoded local UNIX socket file', () => {
        ['%2Fpath%2Fto%2Fsocket', '.%2Fpath%2Fto%2Fsocket', '..%2Fpath%2Fto%2Fsocket'].forEach(socket => {
            expect(parsePlainAddress(socket)).to.deep.equal({ host: undefined, port: undefined, socket: socket.replace(/%2F/g, '/') });
        });
    });

    it('parses a valid custom-encoded local UNIX socket file', () => {
        ['(/path/to/socket)', '(./path/to/socket)', '(../path/to/socket)'].forEach(socket => {
            expect(parsePlainAddress(socket)).to.deep.equal({ host: undefined, port: undefined, socket: socket.replace(/[()]/g, '') });
        });
    });
});
