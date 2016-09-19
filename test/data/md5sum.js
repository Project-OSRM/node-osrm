'use strict'

var crypto = require('crypto');
var fs = require('fs');

if (process.argv.length < 3) {
    console.error('Please pass path to data.md5sum file to use to validate');
    process.exit(1);
}

var BUFFER_SIZE = 8192

function md5FileSync (filename) {
  var fd = fs.openSync(filename, 'r')
  var hash = crypto.createHash('md5')
  var buffer = new Buffer(BUFFER_SIZE)

  try {
    var bytesRead

    do {
      bytesRead = fs.readSync(fd, buffer, 0, BUFFER_SIZE)
      hash.update(buffer.slice(0, bytesRead))
    } while (bytesRead === BUFFER_SIZE)
  } finally {
    fs.closeSync(fd)
  }

  return hash.digest('hex')
}

var validate_file = process.argv[2];

var sums = {};
var lines = fs.readFileSync(validate_file).
  toString().
  split('\n').
  filter(function(line) {
    return line !== "";
});

var error = 0;

lines.forEach(function(line) {
    var parts = line.split('  ');
    var filename = parts[1];
    var md5 = parts[0];
    sums[filename] = md5;
    var md5_actual = md5FileSync(filename);
    if (md5_actual !== md5) {
        error++;
    } else {
        console.log(filename + ': OK');
    }
})

if (error > 0) {
    console.error('ms5sum.js WARNING: 1 computed checksum did NOT match');
    console.error('\nExpected:')
    lines.forEach(function(line) {
        var parts = line.split('  ');
        var filename = parts[1];
        var md5 = parts[0];
        console.log(md5 + '  ' + filename);
    })
    process.exit(1);
} else {
    process.exit(0);
}
