'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.config.includeStack = true;
chai.use(chaiAsPromised);

global.chai = chai;

global.Client = require('lib/Protocol/Client');
global.Encoding = require('lib/Protocol/Encoding');
global.Messages = require('lib/Protocol/Messages');

global.nullStream = {
    on: function () {},
    write: function () {}
};
