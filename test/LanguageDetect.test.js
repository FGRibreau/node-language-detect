(function() {
  var Index, LanguageDetect, Parser;
  require('nodeunit');
  LanguageDetect = require('../lib/LanguageDetect');
  Parser = require('../lib/Parser');
  Index = require('../index');
  exports.index = function(t) {
    t.expect(2);
    t.equal(typeof Index, 'function');
    t.equal(typeof new Index().detect, 'function');
    return t.done();
  };
  exports._distance = function(t) {
    var a, l, str, trigram_freqs;
    str = 'from SW HOUSTON to #PVnation SOPHOMORE STATUS Just A Soul Whose Intentions Are Good Self-expression should always b limitless if that bothers u...dont follow me';
    a = new LanguageDetect(str);
    l = new Parser(str);
    l.setPadStart(true);
    l.analyze();
    trigram_freqs = l.getTrigramRanks();
    t.equal(a._distance(a._lang_db['arabic'], trigram_freqs), 42900);
    t.equal(a._distance(a._lang_db['azeri'], trigram_freqs), 41727);
    t.equal(a._distance(a._lang_db['bengali'], trigram_freqs), 42900);
    t.equal(a._distance(a._lang_db['bulgarian'], trigram_freqs), 42900);
    t.equal(a._distance(a._lang_db['cebuano'], trigram_freqs), 40041);
    t.equal(a._distance(a._lang_db['croatian'], trigram_freqs), 37103);
    t.equal(a._distance(a._lang_db['czech'], trigram_freqs), 39100);
    t.equal(a._distance(a._lang_db['danish'], trigram_freqs), 35334);
    t.equal(a._distance(a._lang_db['dutch'], trigram_freqs), 37691);
    t.equal(a._distance(a._lang_db['english'], trigram_freqs), 27435);
    t.equal(a._distance(a._lang_db['estonian'], trigram_freqs), 37512);
    t.equal(a._distance(a._lang_db['farsi'], trigram_freqs), 42900);
    t.equal(a._distance(a._lang_db['finnish'], trigram_freqs), 38619);
    t.equal(a._distance(a._lang_db['french'], trigram_freqs), 34141);
    t.equal(a._distance(a._lang_db['german'], trigram_freqs), 37005);
    t.equal(a._distance(a._lang_db['hausa'], trigram_freqs), 40622);
    t.equal(a._distance(a._lang_db['hawaiian'], trigram_freqs), 40878);
    t.equal(a._distance(a._lang_db['hindi'], trigram_freqs), 42900);
    t.equal(a._distance(a._lang_db['hungarian'], trigram_freqs), 37880);
    t.equal(a._distance(a._lang_db['icelandic'], trigram_freqs), 39340);
    t.equal(a._distance(a._lang_db['indonesian'], trigram_freqs), 40286);
    t.equal(a._distance(a._lang_db['italian'], trigram_freqs), 34882);
    t.equal(a._distance(a._lang_db['kazakh'], trigram_freqs), 42900);
    return t.done();
  };
  exports._normalize_score = function(t) {
    var clean, l;
    l = new LanguageDetect();
    clean = function(o) {
      if (o === 0) {
        return o;
      } else {
        return (+(o + '').substr(0, 15)) + 0.0000000000001;
      }
    };
    t.equal(clean(l._normalize_score(42900, 143)), 0);
    t.equal(clean(l._normalize_score(34548, 143)), 0.1946853146854);
    t.equal(clean(l._normalize_score(39626, 143)), 0.0763170163171);
    t.equal(clean(l._normalize_score(37236, 143)), 0.132027972028);
    t.equal(clean(l._normalize_score(35401, 143)), 0.1748018648019);
    t.equal(clean(l._normalize_score(37165, 143)), 0.133682983683);
    t.equal(clean(l._normalize_score(37828, 143)), 0.1182284382285);
    t.equal(clean(l._normalize_score(39912, 143)), 0.0696503496504);
    t.equal(clean(l._normalize_score(36439, 143)), 0.1506060606061);
    t.equal(clean(l._normalize_score(39920, 143)), 0.0694638694639);
    t.equal(clean(l._normalize_score(41657, 143)), 0.0289743589744);
    return t.done();
  };
  exports._detect = function(t) {
    var l, r, tweet;
    l = new LanguageDetect();
    tweet = 'from SW HOUSTON to #PVnation SOPHOMORE STATUS Just A Soul Whose Intentions Are Good Self-expression should always b limitless if that bothers u...dont follow me';
    r = l.detect(tweet);
    t.deepEqual(r[0], ['english', 0.3604895104895105]);
    return t.done();
  };
}).call(this);
