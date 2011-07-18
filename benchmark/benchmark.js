(function() {
  var LanguageDetect, data, l, ok, os, r, t, text, _i, _len;
  os = require('os');
  data = require('./data/text');
  LanguageDetect = require('../index');
  l = new LanguageDetect();
  t = os.uptime();
  ok = 0;
  for (_i = 0, _len = data.length; _i < _len; _i++) {
    text = data[_i];
    r = l.detect(text.text);
    if (r[0][1] > 0.2) {
      ok++;
    }
  }
  console.log("" + data.length + " items processed in " + (os.uptime() - t) + " secs (" + ok + " with a score > 0.2)");
}).call(this);
