/*
 * Node Concat v0.1
 *
 * This is a simple command line build script. It can be used to concatenate many javascript
 * files into a single file. It is pretty primitive but it gets the job done. Check the
 * readme for basic usage instructions.
 *
 * This is port of the Ruby Concat script at https://github.com/knicklabs/RubyConcat. It
 * includes some improvements over the original.
 *
 * Copyright (c) 2012 Nickolas Kenyeres
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
 * to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
 * TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

var concat = function(options) {
  this.options = options || {};
  this.manifest = options.manifest || 'manifest.txt';
  this.destination = options.destination || 'output.js';
  this.fs = require('fs');
  this.fshistory = [];

  this.platform = require('os').platform();
  this.slash = (this.platform == 'win32') ? '\\' : '/';
  this.nl = (this.platform == 'win32') ? '\r\n' : '\n';

  this.pathFromCurrentDir = function(path) {
    return this.fs.realpathSync(path);
  };

  this.appendFileToFile = function(src, dst) {
    if (src.charAt(0) != '.' && this.inHistory(src) !== true) {
      var that = this;
      that.addToHistory(src);

      this.fs.readFile(src, 'utf-8', function(err, data) {
        if (err) throw err;

        that.fs.createWriteStream(dst, {flags: 'a'}).end('/* '+src+' */\n'+data+'\n\n');
      });
    }
  };

  this.appendFileToFileSync = function(src, dst) {
    if (src.charAt(0) != '.' && this.inHistory(src) !== true) {
      this.addToHistory(src);

      var data = this.fs.readFileSync(src, 'utf-8');

	  var file = this.fs.openSync(dst, 'a');
	  this.fs.writeSync(file, '/* '+src+' */\n'+data+'\n\n', file.length, 'utf-8');
	  this.fs.close(file);
    }
  };

  this.appendDirToFile = function(src, dst) {
    var that = this;

    this.fs.readdir(src, function(err, files) {
      if (err) throw err;

      for (var i = 0; i < files.length; i++) {
        n = files[i];
        f = src + that.slash + n;
        s = that.fs.lstatSync(f);

        if (n.charAt(0) != '.') {
          if (s.isDirectory()) {
            that.appendDirToFile(f, dst);
          } else {
            that.appendFileToFile(f, dst);
          }
        }
      }
    });
  };

  this.appendDirToFileSync = function(src, dst) {
    var files = this.fs.readdirSync(src);

    for (var i = 0; i < files.length; i++) {
      n = files[i];
      f = src + this.slash + n;
      s = this.fs.lstatSync(f);

      if (n.charAt(0) != '.') {
        if (s.isDirectory()) {
          this.appendDirToFileSync(f, dst);
        } else {
          this.appendFileToFileSync(f, dst);
        }
      }
    }
  };

  this.process = function() {
    var that = this;

    this.fs.createWriteStream(this.destination, {flags: 'w'});
    this.fs.readFile(this.manifest, 'utf-8', function(err, data) {
      if (err) throw err;

      var files = data.split(that.nl).map(function(f) {
        if (f.length) f = that.pathFromCurrentDir(f);
        return f;
      });

      for (var i = 0; i < files.length; i++) {
        if (!files[i].length) continue;
        f = files[i];
        s = that.fs.lstatSync(f);

        if (s.isDirectory()) {
          that.appendDirToFile(f, that.destination);
        } else {
          that.appendFileToFile(f, that.destination);
        }
      }
    });
  };

  this.processSync = function() {
    var that = this;

    this.fs.writeFileSync(this.destination, '', 'utf-8');

    var data = this.fs.readFileSync(this.manifest, 'utf-8');
    var files = data.split(that.nl).map(function(f) {
      if (f.length) f = that.pathFromCurrentDir(f);
      return f;
    });

    for (var i = 0; i < files.length; i++) {
      if (!files[i].length) continue;
      f = files[i];
      s = that.fs.lstatSync(f);

      if (s.isDirectory()) {
        that.appendDirToFileSync(f, that.destination);
      } else {
        that.appendFileToFileSync(f, that.destination);
      }
    }
  };

  this.addToHistory = function(src) {
    this.fshistory.push(src);
  };

  this.inHistory = function(src) {
    for (var i = 0; i < this.fshistory.length; i++) {
      if (src == this.fshistory[i]) {
        return true;
      }
    }
    return false;
  };
};

module.exports = concat;