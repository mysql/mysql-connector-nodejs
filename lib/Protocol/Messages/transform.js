#!/usr/bin/env node

/*
 * Copyright (c) 2015, 2017, Oracle and/or its affiliates. All rights reserved.
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

"use strict";

if (!String.prototype.endsWith) {
    String.prototype.endsWith = function(searchString, position) {
        var subjectString = this.toString();
        if (position === undefined || position > subjectString.length) {
            position = subjectString.length;
        }
        position -= searchString.length;
        var lastIndex = subjectString.indexOf(searchString, position);
        return lastIndex !== -1 && lastIndex === position;
    };
}

var ArgumentParser = require('argparse').ArgumentParser;
var parser = new ArgumentParser({
    prog: "transform",
    //description: require('../../../package.json').description,
    //version: require('../../../package.json').version,
    addHelp: true
});
parser.addArgument(
    [ '-p', '--protodir' ],
    {
        action: 'store',
        type: 'string',
        help: 'Directory with MySQL X Protobuffer files'
    }
);
parser.addArgument(
    [ '-o', '--outdir' ],
    {
        action: 'store',
        type: 'string',
        default: '.',
        help: 'Directory to store generated files'
    }
);
var args = parser.parseArgs();

var fs = require('fs');
var input_stream;
fs.readdirSync(args.protodir).forEach(function (file) {
    if (!file.endsWith(".proto")) {
        return;
    }

    var infile = args.protodir + '/' + file;
    var outfile = args.outdir + '/' + file.replace(/\.proto/, '.json');

    console.log("   %s\n-> %s", infile, outfile);

    input_stream = fs.createReadStream(infile);

    var input_buffer = new Buffer('');
    input_stream.on('data', function (chunk) {
        input_buffer = Buffer.concat([input_buffer, chunk]);
    });

    input_stream.on('end', function () {
        var proto2json = require('proto2json');

        proto2json.parse(input_buffer.toString(), function (err, json) {
            if (err) {
                throw err;
            }

            var data = JSON.stringify(json, null, '  ') + '\n';

                fs.writeFile(outfile, data, function (err) {
                    if (err) {
                        throw err;
                    }
                });
        });
    });
});
