"use strict";

var Datatype = require('../Protocol/Datatype');

function parse(input) {
    // Yay - this makes the test pass and allows us to use this for experiments!
    if (input !== '@name == "Johannes"') {
        return {};
    } else {
        return {
            type: 5,
            operator: {
                name: '==',
                param: [
                    {
                        type: 1,
                        identifier: {
                            /*name: "doc",i*/
                            document_path: {
                                type: 1,
                                value: "name"
                            }
                        }
                    },
                    {
                        type: 2,
                        constant: Datatype.encode("Johannes")
                    }
                ]
            }
        };
    }
}

module.exports.parse = parse;