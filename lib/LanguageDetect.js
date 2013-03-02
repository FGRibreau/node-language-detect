/**
 *
 * Detects the language of a given piece of text.
 *
 * Attempts to detect the language of a sample of text by correlating ranked
 * 3-gram frequencies to a table of 3-gram frequencies of known languages.
 *
 * Implements a version of a technique originally proposed by Cavnar & Trenkle
 * (1994): "N-Gram-Based Text Categorization"
 *
 * Largely inspired from the PHP Pear Package Text_LanguageDetect by Nicholas Pisarro
 * Licence: http://www.debian.org/misc/bsd.license BSD
 *
 * Francois-Guillaume Ribreau - @FGRibreau
 * https://github.com/FGRibreau/node-language-detect
 *
 * Installation:
 *  npm install LanguageDetect
 *
 * Example usage:
 *
 * <code>
 * var LanguageDetect = require("../LanguageDetect");
 * var d = new LanguageDetect().detect('This is a test');
 * // d[0] == 'english'
 * // d[1] == 0.5969230769230769
 * // Good score are over 0.3
 * </code>
 */

var dbLang = require('../data/lang.json');
var Parser = require('./Parser');

var LanguageDetect = module.exports = function () {

  /**
   * The trigram data for comparison
   *
   * Will be loaded on start from $this->_db_filename
   *
   * May be set to a PEAR_Error object if there is an error during its
   * initialization
   *
   * @var      array
   * @access   private
   */
  this.langDb = {};

  /**
   * The size of the trigram data arrays
   *
   * @var     int
   * @access  private
   */
  this.threshold = 300;

  /**
   * Constructor
   *
   * Load the language database.
   *
   */
  this.langDb = dbLang['trigram'];
}

LanguageDetect.prototype = {

  /**
   * Returns the number of languages that this object can detect
   *
   * @access public
   * @return int the number of languages
   */
  getLanguageCount:function () {
    return this.getLanguages().length;
  },

  /**
   * Returns the list of detectable languages
   *
   * @access public
   * @return object the names of the languages known to this object
   */
  getLanguages:function () {
    return Object.keys(this.langDb);
  },

  /**
   * Calculates a linear rank-order distance statistic between two sets of
   * ranked trigrams
   *
   * Sums the differences in rank for each trigram. If the trigram does not
   * appear in both, consider it a difference of $this->_threshold.
   *
   * This distance measure was proposed by Cavnar & Trenkle (1994). Despite
   * its simplicity it has been shown to be highly accurate for language
   * identification tasks.
   *
   * @access  private
   * @param   arr1  the reference set of trigram ranks
   * @param   arr2  the target set of trigram ranks
   * @return  int   the sum of the differences between the ranks of
   *                the two trigram sets
   */
  distance:function (arr1, arr2) {
    var sumdist = 0, value, distance, keys = Object.keys(arr2);

    for (var i = 0, iM = keys.length; i < iM; i++) {
      value = arr2[keys[i]];
      distance = null;

      distance = arr1[keys[i]] ? Math.abs(value - arr1[keys[i]]) : this.threshold;

      sumdist += distance;
    }

    return sumdist;
  },

  /**
   * Normalizes the score returned by _distance()
   *
   * Different if perl compatible or not
   *
   * @access  private
   * @param   score       the score from _distance()
   * @param   baseCount   the number of trigrams being considered
   * @return  number      the normalized score
   *
   * @see     distance()
   */
  normalizeScore:function (score, baseCount) {
    return 1 - (score / (baseCount || this.threshold) / this.threshold);
  },

  /**
   * Detects the closeness of a sample of text to the known languages
   *
   * Calculates the statistical difference between the text and
   * the trigrams for each language, normalizes the score then
   * returns results for all languages in sorted order
   *
   * If perl compatible, the score is 300-0, 0 being most similar.
   * Otherwise, it's 0-1 with 1 being most similar.
   *
   * The $sample text should be at least a few sentences in length;
   * should be ascii-7 or utf8 encoded, if another and the mbstring extension
   * is present it will try to detect and convert. However, experience has
   * shown that mb_detect_encoding() *does not work very well* with at least
   * some types of encoding.
   *
   * @access  public
   * @param   sample  a sample of text to compare.
   * @param   limit  if specified, return an array of the most likely
   *                  $limit languages and their scores.
   * @return  Array   sorted array of language scores, blank array if no
   *                  useable text was found, or PEAR_Error if error
   *                  with the object setup
   *
   * @see     distance()
   */
  detect:function (sample, limit) {
    var limit = +limit || 0
      , possibleLangs
      , scores = [];

    // input check
    if (sample == '' && sample.length < 3) {
      return [];
    }

    var sampleObj = new Parser(sample);
    sampleObj.setPadStart(true);
    sampleObj.analyze();

    var trigramFreqs = sampleObj.getTrigramRanks();

    var trigramCount = Object.keys(trigramFreqs).length;

    if (trigramCount == 0) return [];

    possibleLangs = Object.keys(this.langDb);

    for (var i = 0, iM = possibleLangs.length; i < iM; i++) {
      var lang = possibleLangs[i];

      var score = this.normalizeScore(this.distance(this.langDb[lang], trigramFreqs), trigramCount);

      if (score) scores.push([lang, score]);
    }

    // Sort the array
    scores = scores.sort(function (a, b) {return b[1] - a[1];});

    if (!scores.length) return [];

    // limit the number of returned scores
    return limit > 0 ? scores.slice(0, limit) : scores;
  }
}