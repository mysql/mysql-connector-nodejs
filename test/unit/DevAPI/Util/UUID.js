'use strict';

/* eslint-env node, mocha */

const UUID = require('lib/DevAPI/Util/UUID');
const expect = require('chai').expect;

describe('UUID', () => {
    let uuid = UUID();

    it('should return a string with the maximum supported length', () => {
        expect(uuid()).to.have.length(32);
    });

    it('should return a hexadecimal string', () => {
        expect(uuid()).to.match(/^[A-F0-9]{32}$/);
    });

    it('should always return the same node ID', () => {
        expect(uuid().substring(0, 12)).to.equal(uuid().substring(0, 12));
    });

    it('should always use a past timestamp', () => {
        const id = uuid();
        const timestamp = parseInt(`0x${id.substring(16, id.length)}`);
        const expected = (Date.now() - Date.UTC(1582, 9, 15)) * 1000000 / 100;

        expect(timestamp).to.be.greaterThan(expected);
    });

    context('assuming the custom component ordering', () => {
        it('should return a value compatible with the RFC 4122 UUID variant', () => {
            const clockSequenceMSBIndex = 12;
            // RFC 4122: variant must be one of the following: 1000, 1001, 1010, 1011.
            const expected = ['8', '9', 'A', 'B'];

            expect(uuid()[clockSequenceMSBIndex]).to.be.oneOf(expected);
        });

        it('should return a value compatible with a V1 UUID', () => {
            const timestampMSBIndex = 16;

            expect(uuid()[timestampMSBIndex]).to.equal('1');
        });

        it('should return a randomly generated node ID as specified by RFC 4122', () => {
            const randomnessIndex = 1;
            const expected = ['1', '3', '5', '7', '9', 'B', 'D', 'F'];

            expect(uuid()[randomnessIndex]).to.be.oneOf(expected);
        });
    });

    context('with multiple calls', () => {
        it('should return a different value for the node ID', () => {
            const generator1 = UUID();
            const generator2 = UUID();

            expect(generator1().substring(0, 12)).to.not.equal(generator2().substring(0, 12));
        });
    });
});
