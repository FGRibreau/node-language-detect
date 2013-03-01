require('nodeunit');

var LanguageDetect = require('../lib/LanguageDetect');
var Parser = require('../lib/Parser');
var Index = require('../index');

exports.index = function (t) {
  t.expect(2);
  t.equal(typeof Index, 'function');
  t.equal(typeof new Index().detect, 'function');

  return t.done();
};

exports._distance = function (t) {
  var str = 'from SW HOUSTON to #PVnation SOPHOMORE STATUS Just A Soul Whose Intentions Are Good Self-expression should always b limitless if that bothers u...dont follow me';
  var a = new LanguageDetect(str);
  var l = new Parser(str);

  l.setPadStart(true);
  l.analyze();

  var trigram_freqs = l.getTrigramRanks();

  t.equal(a._distance(a._lang_db['arabic'], trigram_freqs), 42900);
  t.equal(a._distance(a._lang_db['azeri'], trigram_freqs), 41739);
  t.equal(a._distance(a._lang_db['bengali'], trigram_freqs), 42900);
  t.equal(a._distance(a._lang_db['bulgarian'], trigram_freqs), 42900);
  t.equal(a._distance(a._lang_db['cebuano'], trigram_freqs), 40051);
  t.equal(a._distance(a._lang_db['croatian'], trigram_freqs), 37390);
  t.equal(a._distance(a._lang_db['czech'], trigram_freqs), 39284);
  t.equal(a._distance(a._lang_db['danish'], trigram_freqs), 35149);
  t.equal(a._distance(a._lang_db['dutch'], trigram_freqs), 37838);
  t.equal(a._distance(a._lang_db['english'], trigram_freqs), 27607);
  t.equal(a._distance(a._lang_db['estonian'], trigram_freqs), 37536);
  t.equal(a._distance(a._lang_db['farsi'], trigram_freqs), 42900);
  t.equal(a._distance(a._lang_db['finnish'], trigram_freqs), 38637);
  t.equal(a._distance(a._lang_db['french'], trigram_freqs), 34185);
  t.equal(a._distance(a._lang_db['german'], trigram_freqs), 37030);
  t.equal(a._distance(a._lang_db['hausa'], trigram_freqs), 40827);
  t.equal(a._distance(a._lang_db['hawaiian'], trigram_freqs), 40890);
  t.equal(a._distance(a._lang_db['hindi'], trigram_freqs), 42900);
  t.equal(a._distance(a._lang_db['hungarian'], trigram_freqs), 37891);
  t.equal(a._distance(a._lang_db['icelandic'], trigram_freqs), 39345);
  t.equal(a._distance(a._lang_db['indonesian'], trigram_freqs), 40298);
  t.equal(a._distance(a._lang_db['italian'], trigram_freqs), 34749);
  t.equal(a._distance(a._lang_db['kazakh'], trigram_freqs), 42900);

  return t.done();
};

exports._normalize_score = function (t) {
  var l = new LanguageDetect();

  var clean = function (o) {
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

exports._detect = function (t) {
  var l = new LanguageDetect();
  var tweet = 'from SW HOUSTON to #PVnation SOPHOMORE STATUS Just A Soul Whose Intentions Are Good Self-expression should always b limitless if that bothers u...dont follow me';
  var r = l.detect(tweet);

  t.deepEqual(r[0], ['english', 0.35648018648018653]);

  return t.done();
};