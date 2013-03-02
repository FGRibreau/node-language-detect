var db_unicode_blocks = require('../data/unicode_blocks.json');

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
  this._threshold = 300;

  /**
   * stores the trigram ranks of the sample
   *
   * @access  private
   * @var     array
   */
  this._trigram_ranks = {};

  /**
   * Whether the parser should compile trigrams
   *
   * @access  private
   * @var     bool
   */
  this._compile_trigram = true;

  /**
   * Whether the trigram parser should pad the beginning of the string
   *
   * @access  private
   * @var     bool
   */
  this._trigram_pad_start = false;

  this._trigram = {};

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
  this._string = string ? string.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/g, '') : '';
};

Parser.prototype = {
  /**
   * turn on/off padding the beginning of the sample string
   *
   * @access  public
   * @param   _bool   true for on, false for off
   */
  setPadStart:function (_bool) {
    var bool = _bool || true;

    this._trigram_pad_start = bool;
  },

  /**
   * Returns the trigram ranks for the text sample
   *
   * @access  public
   * @return  array   trigram ranks in the text sample
   */
  getTrigramRanks:function () {
    return this._trigram_ranks;
  },

  _getBlockCount:function () {
    return db_unicode_blocks.length;
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
    var len = this._string.length;
    var byte_counter = 0;
    var a = ' ', b = ' ';
    var dropone;
    var tmp;
    var _char;

    // trigram startup
    if (this._compile_trigram) {
      // initialize them as blank so the parser will skip the first two
      // (since it skips trigrams with more than  2 contiguous spaces)
      a = ' ';
      b = ' ';

      // kludge
      // if it finds a valid trigram to start and the start pad option is
      // off, then set a variable that will be used to reduce this
      // trigram after parsing has finished
      if (!this._trigram_pad_start) {
        tmp = this._next_char(this._string, byte_counter);
        byte_counter = tmp[0];
        a = tmp[1];

        if (a != ' ') {
          tmp = this._next_char(this._string, byte_counter);
          byte_counter = tmp[0];
          b = tmp[1];

          dropone = ' ' + a + b;
        }

        byte_counter = 0;
        a = ' ';
        b = ' ';
      }
    }

    while (byte_counter < len) {

      tmp = this._next_char(this._string, byte_counter);
      byte_counter = tmp[0];
      _char = tmp[1];

      // language trigram detection
      if (this._compile_trigram) {
        if (!(b == ' ' && (a == ' ' || _char == ' '))) {
          if (!(this._trigram[a + b + _char])) {
            this._trigram[a + b + _char] = 1;
          } else {
            this._trigram[a + b + _char]++;
          }
        }

        a = b;
        b = _char;
      }
    }

    // trigram cleanup
    if (this._compile_trigram) {
      // pad the end
      if (b != ' ') {
        if (!this._trigram[a + b + ' ']) {
          this._trigram[a + b + ' '] = 1;
        } else {
          this._trigram[a + b + ' ']++;
        }
      }

      // perl compatibility; Language::Guess does not pad the beginning
      // kludge
      if (typeof dropone != 'undefined') {
        if (this._trigram[dropone] == 1) {
          delete (this._trigram[dropone]);
        } else {
          this._trigram[dropone];
        }
      }

      if (this._trigram && Object.keys(this._trigram).length > 0) {
        this._trigram_ranks = this._arr_rank(this._trigram);
      } else {
        this._trigram_ranks = {};
      }
    }
  },

  /**
   * utf8-safe fast character iterator
   *
   * Will get the next character starting from $counter, which will then be
   * incremented. If a multi-byte char the bytes will be concatenated and
   * $counter will be incremeted by the number of bytes in the char.
   *
   * @access  private
   * @param   str     the string being iterated over
   * @param   counter the iterator, will increment by reference
   *
   * @return  Array   the next (possibly multi-byte) char from $counter
   */
  _next_char:function (str, counter) {
    var _char = str.charAt(counter++);
    return [counter, _char.toLowerCase()];
  },

  /**
   * Sorts an array by value breaking ties alphabetically
   *
   * @access private
   * @param arr the array to sort
   */
  _bub_sort:function (arr) {
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

    combined = combined.sort(this._sort_func);

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
  _arr_rank:function (arr) {

    // sorts alphabetically first as a standard way of breaking rank ties
    arr = this._bub_sort(arr);

    var rank = {}, i = 0;

    for (var key in arr) {
      rank[key] = i++;

      // cut off at a standard threshold
      if (i >= this._threshold) {
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
   * @see      _bub_sort()
   */
  _sort_func:function (a, b) {
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