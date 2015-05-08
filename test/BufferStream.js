"use strict";

var assert = require("assert");
var BufferStream = require("../lib/BufferStream").BufferStream;

describe('BufferStream', function() {
  describe('tell', function() {
    it('should return 0 when not seeked', function() {
      var buffer = new Buffer("abcdefghijklmnopqrstuvwxyz", "ascii");
      var s = new BufferStream(buffer);
      assert.equal(0, s.tell());
    })
    it('should return 10 after seek(10)', function() {
      var buffer = new Buffer("abcdefghijklmnopqrstuvwxyz", "ascii");
      var s = new BufferStream(buffer);
      s.seek(10);
      assert.equal(10, s.tell());
    })
    it('should not change with invalid seek', function() {
      var buffer = new Buffer("abcdefghijklmnopqrstuvwxyz", "ascii");
      var s = new BufferStream(buffer);
      s.seek(10);
      assert.throws(
        function() {
          s.seek(30);
        },
        Error
      );
      assert.equal(10, s.tell());
    })
  })
  describe('seek', function() {
    it('should throw when seeking to negative position', function() {
      var buffer = new Buffer("abcdefghijklmnopqrstuvwxyz", "ascii");
      var s = new BufferStream(buffer);
      assert.throws(
        function() {
          s.seek(-1);
        },
        Error
      );
    })
    it('should not throw when seeking to last position', function() {
      var buffer = new Buffer("abcdefghijklmnopqrstuvwxyz", "ascii");
      var s = new BufferStream(buffer);
      assert.doesNotThrow(
        function() {
          s.seek(25);
        },
        Error
      );
    })
    it('should throw when seeking behind last position', function() {
      var buffer = new Buffer("abcdefghijklmnopqrstuvwxyz", "ascii");
      var s = new BufferStream(buffer);
      assert.throws(
        function() {
          s.seek(26);
        },
        Error
      );
    })
  })
  describe('getByte', function() {
    it('should return first byte on first call', function() {
      var text = "abcdefghijklmnopqrstuvwxyz";
      var buffer = new Buffer(text, "ascii");
      var s = new BufferStream(buffer);
      assert.equal(text.charCodeAt(0), s.getByte());
    })
    it('should return second byte on second call', function() {
      var text = "abcdefghijklmnopqrstuvwxyz";
      var buffer = new Buffer(text, "ascii");
      var s = new BufferStream(buffer);
      assert.equal(text.charCodeAt(0), s.getByte());
      assert.equal(text.charCodeAt(1), s.getByte());
    })
    it('should increase tell() value by one', function() {
      var text = "abcdefghijklmnopqrstuvwxyz";
      var buffer = new Buffer(text, "ascii");
      var s = new BufferStream(buffer);
      assert.equal(0, s.tell());
      assert.equal(text.charCodeAt(0), s.getByte());
      assert.equal(1, s.tell());
      assert.equal(text.charCodeAt(1), s.getByte());
      assert.equal(2, s.tell());
    })
    it('should be able to read last byte', function() {
      var text = "abcdefghijklmnopqrstuvwxyz";
      var buffer = new Buffer(text, "ascii");
      var s = new BufferStream(buffer);
      s.seek(25);
      assert.equal(text.charCodeAt(25), s.getByte());
    })
    it('should throw when reading past last byte', function() {
      var text = "abcdefghijklmnopqrstuvwxyz";
      var buffer = new Buffer(text, "ascii");
      var s = new BufferStream(buffer);
      s.seek(25);
      assert.equal(text.charCodeAt(25), s.getByte());
      assert.throws(
        function() {
          s.getByte();
        },
        Error
      );
    })
  })
  describe('getSlice', function() {
    it('should return a slice from the beginning', function() {
      var text = "abcdefghijklmnopqrstuvwxyz";
      var buffer = new Buffer(text, "ascii");
      var s = new BufferStream(buffer);
      var l = s.getSlice(10);
      for (var i = 0; i < 10; ++i) {
        assert.equal(buffer[i]+0, l[i]);
      }
    })
    it('should tell the new position', function() {
      var text = "abcdefghijklmnopqrstuvwxyz";
      var buffer = new Buffer(text, "ascii");
      var s = new BufferStream(buffer);
      var l = s.getSlice(10);
      assert.equal(10, s.tell());
    })
    it('should throw an exception when going beyond the end', function() {
      var text = "abcdefghijklmnopqrstuvwxyz";
      var buffer = new Buffer(text, "ascii");
      var s = new BufferStream(buffer);
      s.seek(20);
      assert.throws(
        function() {
          var l = s.getSlice(10);
        },
        Error
      );
    })
    it('should allow reading the last byte', function() {
      var text = "abcdefghijklmnopqrstuvwxyz";
      var buffer = new Buffer(text, "ascii");
      var s = new BufferStream(buffer);
      s.seek(25);
      var b = s.getSlice(1);
      assert.equal(text.charCodeAt(25), b[0]);
    })
  })
})

