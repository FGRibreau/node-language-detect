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

var php = require('./phpjs')
,   db_lang = require('../data/lang')
,   Parser = require('./Parser');

var LanguageDetect = module.exports = function(){

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
     this._lang_db = {};

    /**
     * stores the map of the trigram data to unicode characters
     *
     * @access private
     * @var array
     */
     this._unicode_map;

    /**
     * The size of the trigram data arrays
     * 
     * @var      int
     * @access   private
     */
     this._threshold = 300;


    /**
     * stores the result of the clustering operation
     *
     * @access  private
     * @var     array
     */
    this._clusters = null;

    /**
     * Constructor
     *
     * Load the language database.
     *
     */
    this._lang_db = db_lang['trigram'];

    if (db_lang['trigram-unicodemap']) {
        this._unicode_map = db_lang['trigram-unicodemap'];
    }

    // Not yet implemented:
    if (db_lang['trigram-clusters']) {
        this._clusters = db_lang['trigram-clusters'];
    }

}

LanguageDetect.prototype = {

    /**
     * Returns the number of languages that this object can detect
     *
     * @access public
     * @return int            the number of languages
     */
    getLanguageCount: function(){
        return this.getLanguages().length;
    }

    /**
     * Returns the list of detectable languages
     *
     * @access public
     * @return array        the names of the languages known to this object
     */
    , getLanguages: function(){
        return Object.keys(this._lang_db);
    }

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
     * @param   array    $arr1  the reference set of trigram ranks
     * @param   array    $arr2  the target set of trigram ranks
     * @return  int             the sum of the differences between the ranks of
     *                          the two trigram sets
     */
    , _distance: function(arr1, arr2){
        var sumdist = 0, value, keys = Object.keys(arr2);

        for (var i = 0, iM = keys.length; i < iM; i++) {
            var value = arr2[keys[i]]
            ,   distance = null;

            if (arr1[keys[i]]) {
                distance = php.abs(value - arr1[keys[i]]);
            } else {
                // $this->_threshold sets the maximum possible distance value
                // for any one pair of trigrams
                distance = this._threshold;
            }
            sumdist += distance;
        }

        return sumdist;

        // todo: there are other distance statistics to try, e.g. relative
        //       entropy, but they're probably more costly to compute
    }

    /**
     * Normalizes the score returned by _distance()
     * 
     * Different if perl compatible or not
     *
     * @access    private
     * @param     int    $score          the score from _distance()
     * @param     int    $base_count     the number of trigrams being considered
     * @return    float                  the normalized score
     * @see       _distance()
     */
    , _normalize_score: function(score, _base_count){
        var base_count = _base_count || null;

        if (base_count === null) {
            base_count = this._threshold;
        }

        return 1 - (score / base_count / this._threshold);
    }

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
     * @param   string  $sample a sample of text to compare.
     * @param   int     $limit  if specified, return an array of the most likely
     *                           $limit languages and their scores.
     * @return  mixed       sorted array of language scores, blank array if no 
     *                      useable text was found, or PEAR_Error if error 
     *                      with the object setup
     * @see     _distance()
     */
    , detect: function(sample, _limit){
        var limit = +_limit || 0
        ,   possible_langs
        ,   scores = [];

        // input check
        if (sample == '' && sample.length < 3){
            return [];
        }

 
        var sample_obj = new Parser(sample);
        sample_obj.setPadStart(true);
        sample_obj.analyze();

        var trigram_freqs = sample_obj.getTrigramRanks();

        var trigram_count = Object.keys(trigram_freqs).length;

        if (trigram_count == 0) {
            return [];
        }


        possible_langs = Object.keys(this._lang_db);

        for(var i = 0, iM = possible_langs.length; i < iM; i++){
            var lang = possible_langs[i];

            scores.push([lang
                        , this._normalize_score(this._distance(this._lang_db[lang], trigram_freqs), trigram_count)]);

        }

        // Sort the array
        scores = scores.sort(function(a, b){return b[1] - a[1];});
        
        // limit the number of returned scores
        return limit > 0 ? scores.slice(0, limit) : scores;
    }
}