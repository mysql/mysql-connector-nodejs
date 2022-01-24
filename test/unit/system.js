/*
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2.0, as
 * published by the Free Software Foundation.
 *
 * This program is also distributed with certain software (including
 * but not limited to OpenSSL) that is licensed under separate terms,
 * as designated in a particular file or component or in included license
 * documentation.  The authors of MySQL hereby grant you an
 * additional permission to link the program and your derivative works
 * with the separately licensed software that they have included with
 * MySQL.
 *
 * Without limiting anything contained in the foregoing, this file,
 * which is part of MySQL Connector/Node.js, is also subject to the
 * Universal FOSS Exception, version 1.0, a copy of which can be found at
 * http://oss.oracle.com/licenses/universal-foss-exception.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License, version 2.0, for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin St, Fifth Floor, Boston, MA 02110-1301  USA
 */

'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let system = require('../../lib/system');

describe('system details', () => {
    let os;

    beforeEach('create fakes', () => {
        os = td.replace('os');
        system = require('../../lib/system');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('brand()', () => {
        it('returns the system brand type and version using a custom convention on FreeBSD', () => {
            td.when(os.platform()).thenReturn('freebsd');
            td.when(os.release()).thenReturn('11.02.0-extra');

            expect(system.brand()).to.equal('FreeBSD-11.02');
        });

        it('returns the system brand type and version using a custom convention on Linux', () => {
            td.when(os.platform()).thenReturn('linux');
            td.when(os.release()).thenReturn('4.15.0-extra');

            expect(system.brand()).to.equal('Linux-4.15.0');
        });

        it('returns the system brand type and version using a custom convention on macOS', () => {
            td.when(os.platform()).thenReturn('darwin');
            td.when(os.release()).thenReturn('18.2.0-extra');

            expect(system.brand()).to.equal('macOS-10.14');
        });

        it('returns the system brand type and version using a custom convention on Solaris', () => {
            td.when(os.platform()).thenReturn('sunos');
            td.when(os.release()).thenReturn('5.11.4-extra');

            expect(system.brand()).to.equal('Solaris-11.4');
        });

        it('returns the system brand type and version using a custom convention on Windows', () => {
            td.when(os.platform()).thenReturn('win32');
            td.when(os.release()).thenReturn('10.0.16299-extra');

            expect(system.brand()).to.equal('Windows-10.0.16299');
        });

        it('returns the system brand type and version using a custom convention on unknown platforms', () => {
            td.when(os.platform()).thenReturn('foo');
            td.when(os.release()).thenReturn('bar');

            expect(system.brand()).to.equal('foo-bar');
        });
    });

    context('hostname()', () => {
        it('returns the hostname of the system', () => {
            td.when(os.hostname()).thenReturn('foo');

            expect(system.hostname()).to.equal('foo');
        });
    });

    context('pid', () => {
        it('returns a stringified version of the process id in the system', () => {
            expect(system.pid()).to.equal(`${process.pid}`);
        });
    });

    context('platform()', () => {
        it('returns the platform name using a custom convention on 64 bit architectures', () => {
            td.when(os.arch()).thenReturn('x64');

            expect(system.platform()).to.equal('x86_64');
        });

        it('returns the platform name using a custom convention on 32 bit architectures', () => {
            td.when(os.arch()).thenReturn('ia32');

            expect(system.platform()).to.equal('i386');
        });

        it('returns the platform name using a custom convention on ARM architectures', () => {
            td.when(os.arch()).thenReturn('arm');

            expect(system.platform()).to.equal('ARM');
        });
    });

    context('time()', () => {
        let now;

        beforeEach('setup fake time', () => {
            now = td.replace(Date, 'now');

            system = require('../../lib/system');
        });

        it('returns current system time in milliseconds elapsed since the Unix epoch', () => {
            const time = 1;

            td.when(now()).thenReturn(time);

            return expect(system.time()).to.equal(time);
        });
    });
});
