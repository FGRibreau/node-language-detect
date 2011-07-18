module.exports = (function(){
  // TODO: Convert the file to json
  return require('../lib/phpjs').unserialize(
    require('fs').readFileSync(__dirname+'/lang.dat', 'utf-8')
);
})()