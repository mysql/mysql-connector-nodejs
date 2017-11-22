'use strict';

/* eslint-env node, mocha */

const UUID = require('lib/DevAPI/Util/UUID');
const expect = require('chai').expect;

describe('UUID', () => {
    it('should return a string with the maximum supported length', () => {
        const uuid = UUID();

        expect(uuid()).to.have.length(32);
    });

    it('should return a hexadecimal string', () => {
        const uuid = UUID();

        expect(uuid()).to.match(/^[A-F0-9]{32}$/);
    });

    it('should always return the same node ID', () => {
        const uuid = UUID();

        expect(uuid().substring(0, 12)).to.equal(uuid().substring(0, 12));
    });

    it('should increment the initial clock sequence', () => {
        const uuid = UUID();
        /* eslint-disable node/no-deprecated-api */
        const firstClockSequence = (new Buffer(uuid(), 'hex')).readUInt8(7);
        const secondClockSequence = (new Buffer(uuid(), 'hex')).readUInt8(7);
        /* eslint-enable node/no-deprecated-api */

        expect(firstClockSequence).to.equal(secondClockSequence - 1);
    });

    it('should generate multiple values without conflicts', function () {
        // This test might take a little bit more time to run.
        this.timeout(10000);

        const uuid = UUID();
        const ids = [];

        // Duplicates were noticed by generating at least 10000 UUIDs.
        for (let i = 0; i < 10000; ++i) {
            ids.push(uuid());
        }

        ids.forEach(id => expect(ids.indexOf(id)).to.equal(ids.lastIndexOf(id)));
    });

    context('custom segment order', () => {
        it('should return a value compatible with the RFC 4122 UUID V1 variant', () => {
            const uuid = UUID();
            const id = uuid();
            /* eslint-disable node/no-deprecated-api */
            const binary = new Buffer(id, 'hex');
            /* eslint-enable node/no-deprecated-api */

            // variant is encoded by the most significant 3 bits of the clock sequence
            const variant = Number(binary.readUInt8(6)).toString(2).slice(0, 3);
            // RFC 4122: variant must be one of the following: 100, 101.
            const expected = ['100', '101'];

            expect(variant).to.be.oneOf(expected);
        });

        it('should return a value compatible with a V1 (time-based) UUID', () => {
            const uuid = UUID();
            const id = uuid();
            /* eslint-disable node/no-deprecated-api */
            const binary = new Buffer(id, 'hex');
            /* eslint-enable node/no-deprecated-api */

            // version is encoded by the most significant 4 bits of the timestamp
            const versionOctet = Number(binary.readUInt8(9)).toString(2);
            const version = versionOctet.slice(versionOctet.length - 1);

            expect(version).to.equal('1');
        });

        it('should return a randomly generated node ID with a special randomness bit', () => {
            const uuid = UUID();
            const id = uuid();
            /* eslint-disable node/no-deprecated-api */
            const binary = new Buffer(id, 'hex');
            /* eslint-enable node/no-deprecated-api */

            // the least significant bit of the first octet of the node identifier should be set to `1`
            const firstOctet = Number(binary.readUInt8(0)).toString(2);
            const randomness = firstOctet.slice(firstOctet.length - 1);

            expect(randomness).to.equal('1');
        });

        it('should always use a past timestamp', () => {
            const uuid = UUID();
            const id = uuid();
            /* eslint-disable node/no-deprecated-api */
            const binary = new Buffer(id, 'hex');
            /* eslint-enable node/no-deprecated-api */

            const timestamp = binary.readUInt8(8, binary.length);
            const expected = (Date.now() - Date.UTC(1582, 9, 15)) * 1000000 / 100;

            expect(timestamp).to.be.lessThan(expected);
        });
    });

    context('multiple generators', () => {
        it('should return a different value for the node ID', () => {
            const generator1 = UUID();
            const generator2 = UUID();

            expect(generator1().substring(0, 12)).to.not.equal(generator2().substring(0, 12));
        });
    });
});
