Protobuf.js
-----------

This is a pure javascript driver for the protocol buffer encoding protocol. It supports most of the types defined by protocol buffers, including 64 bit integers which are returned as [long](https://github.com/dcodeIO/long.js) objects.

What it does:
=============

* reads output from [proto2json](https://github.com/Sannis/node-proto2json) as a schema
* encodes objects to buffers
* decodes buffers to objects

What it does not do:
====================

* make your breakfast


Usage
=====

```javascript
var protobuf = require('protobuf.js');
var proto2json = require('node-proto2json');
proto2json.parse(fs.readFileSync('./riak_kv.proto', 'utf8'), function (err, result) {
    var translator = new protobuf(result);

    //msg will *only* contain the protobuf encoded message, *NOT* the full riak packet
    var msg = translator.encode('RpbGetReq', { bucket: 'test', key: 'test' });

    //again, this will *only* decode the protobuf message. you have to remove the riak header yourself
    var decoded = translator.decode('RpbGetResp', responsePacket);
});

```
