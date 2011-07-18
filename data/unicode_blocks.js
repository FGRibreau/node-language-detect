module.exports = (function(){
  // TODO: Convert the file to json
  var r = require('../lib/phpjs').unserialize(
    require('fs').readFileSync(__dirname+'/unicode_blocks.dat', 'utf-8')
  );

  // Bugfix: unserialize returns an Object instead of an Array
  var a = [];
  for (var i = 0, iM = Object.keys(r).length; i < iM; i++) {
    a[i] = r[i];
  };
  return a;
})()