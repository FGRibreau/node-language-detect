var data = JSON.parse(require('fs').readFileSync('./data/text.js', 'utf-8'));
var LanguageDetect = require('../index');

var l = new LanguageDetect();

var ok = 0;

var start = Date.now();
for (var i in data) {
  var text = data[i];
  var r = l.detect(text.text);
  if (!r.length) continue;

  if (r[0][1] > 0.2) {
    ok++;
  }
}
var end = Date.now();

var time = Math.round((end-start))/1000;

console.log(data.length + " items processed in " + time + " secs (" + ok + " with a score > 0.2)");
