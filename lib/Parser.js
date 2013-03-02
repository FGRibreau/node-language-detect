var dbUnicodeBlocks = require('../data/unicode_blocks.json');

/**
 * This class represents a text sample to be parsed.
 *
 * Largely inspired from the PHP Pear Package Text_LanguageDetect by Nicholas Pisarro
 * Licence: http://www.debian.org/misc/bsd.license BSD
 *
 * Francois-Guillaume Ribreau - @FGRibreau
 * https://github.com/FGRibreau/node-language-detect
 */
var Parser = module.exports = function (string) {
  /**
   * The size of the trigram data arrays
   *
   * @access   private
   * @var      int
   */
  this.threshold = 300;

  /**
   * stores the trigram ranks of the sample
   *
   * @access  private
   * @var     array
   */
  this.trigramRanks = {};

  /**
   * Whether the parser should compile trigrams
   *
   * @access  private
   * @var     bool
   */
  this.compileTrigram = true;

  /**
   * Whether the trigram parser should pad the beginning of the string
   *
   * @access  private
   * @var     bool
   */
  this.trigramPadStart = false;

  this.trigram = {};

  /**
   * the piece of text being parsed
   *
   * @access  private
   * @var     string
   */

  /**
   * Constructor
   *
   * @access  private
   * @param   string  string to be parsed
   */
  this.string = string ? string.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/g, '') : '';
};

Parser.prototype = {
  /**
   * turn on/off padding the beginning of the sample string
   *
   * @access  public
   * @param   bool   true for on, false for off
   */
  setPadStart:function (bool) {
    this.trigramPadStart = bool || true;
  },

  /**
   * Returns the trigram ranks for the text sample
   *
   * @access  public
   * @return  array   trigram ranks in the text sample
   */
  getTrigramRanks:function () {
    return this.trigramRanks;
  },

  getBlockCount:function () {
    return dbUnicodeBlocks.length;
  },

  /**
   * Executes the parsing operation
   *
   * Be sure to call the set*() functions to set options and the
   * prepare*() functions first to tell it what kind of data to compute
   *
   * Afterwards the get*() functions can be used to access the compiled
   * information.
   *
   * @access public
   */
  analyze:function () {
    var len = this.string.length;
    var byteCounter = 0;
    var a = ' ', b = ' ';
    var dropone, tmp, char;

    // trigram startup
    if (this.compileTrigram) {
      // initialize them as blank so the parser will skip the first two
      // (since it skips trigrams with more than  2 contiguous spaces)
      a = ' ';
      b = ' ';

      // kludge
      // if it finds a valid trigram to start and the start pad option is
      // off, then set a variable that will be used to reduce this
      // trigram after parsing has finished
      if (!this.trigramPadStart) {
        a = this.string.charAt(byteCounter++).toLowerCase();

        if (a != ' ') {
          b = this.string.charAt(byteCounter).toLowerCase();
          dropone = ' ' + a + b;
        }

        byteCounter = 0;
        a = ' ';
        b = ' ';
      }
    }

    while (byteCounter < len) {
      char = this.string.charAt(byteCounter++).toLowerCase();

      // language trigram detection
      if (this.compileTrigram) {
        if (!(b == ' ' && (a == ' ' || char == ' '))) {
          if (!(this.trigram[a + b + char])) {
            this.trigram[a + b + char] = 1;
          } else {
            this.trigram[a + b + char]++;
          }
        }

        a = b;
        b = char;
      }
    }

    // trigram cleanup
    if (this.compileTrigram) {
      // pad the end
      if (b != ' ') {
        if (!this.trigram[a + b + ' ']) {
          this.trigram[a + b + ' '] = 1;
        } else {
          this.trigram[a + b + ' ']++;
        }
      }

      // perl compatibility; Language::Guess does not pad the beginning
      // kludge
      if (typeof dropone != 'undefined') {
        if (this.trigram[dropone] == 1) {
          delete (this.trigram[dropone]);
        } else {
          this.trigram[dropone];
        }
      }

      if (this.trigram && Object.keys(this.trigram).length > 0) {
        this.trigramRanks = this.arrRank(this.trigram);
      } else {
        this.trigramRanks = {};
      }
    }
  },

  /**
   * Sorts an array by value breaking ties alphabetically
   *
   * @access private
   * @param arr the array to sort
   */
  bubleSort:function (arr) {
    // should do the same as this perl statement:
    // sort { $trigrams{$b} == $trigrams{$a} ?  $a cmp $b : $trigrams{$b} <=> $trigrams{$a} }

    // needs to sort by both key and value at once
    // using the key to break ties for the value

    // converts array into an array of arrays of each key and value
    // may be a better way of doing this
    var combined = [];

    for (var key in arr) {
      combined.push([key, arr[key]]);
    }

    combined = combined.sort(this.sortFunc);

    var replacement = {};

    for (var key in combined) {
      var value = combined[key];

      replacement[value[0]] = value[1];
    }

    return replacement;
  },

  /**
   * Converts a set of trigrams from frequencies to ranks
   *
   * Thresholds (cuts off) the list at $this->_threshold
   *
   * @access  protected
   * @param   arr     array of trgram
   * @return  object  ranks of trigrams
   */
  arrRank:function (arr) {

    // sorts alphabetically first as a standard way of breaking rank ties
    arr = this.bubleSort(arr);

    var rank = {}, i = 0;

    for (var key in arr) {
      rank[key] = i++;

      // cut off at a standard threshold
      if (i >= this.threshold) {
        break;
      }
    }

    return rank;
  },

  /**
   * Sort function used by bubble sort
   *
   * Callback function for usort().
   *
   * @access   private
   * @param    a    first param passed by usort()
   * @param    b    second param passed by usort()
   * @return   int  1 if $a is greater, -1 if not
   *
   * @see      bubleSort()
   */
  sortFunc:function (a, b) {
    // each is actually a key/value pair, so that it can compare using both
    var a_key = a[0]
      , a_value = a[1]
      , b_key = b[0]
      , b_value = b[1];

    // if the values are the same, break ties using the key
    if (a_value == b_value) {
      return ((a_key == b_key) ? 0 : ((a_key > b_key) ? 1 : -1));

      // if not, just sort normally
    } else {
      if (a_value > b_value) {
        return -1;
      } else {
        return 1;
      }
    }

    // 0 should not be possible because keys must be unique
  }
};