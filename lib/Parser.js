var db_unicode_blocks = require('../data/unicode_blocks');
var php = require('../lib/phpjs');

/**
 * This class represents a text sample to be parsed.
 *
 * Largely inspired from the PHP Pear Package Text_LanguageDetect by Nicholas Pisarro
 * Licence: http://www.debian.org/misc/bsd.license BSD
 *
 * Francois-Guillaume Ribreau - @FGRibreau
 * https://github.com/FGRibreau/node-language-detect
 */
var Parser = module.exports = function(string){
    /**
     * stores the trigram frequencies of the sample
     *
     * @access  private
     * @var     string
     */
   this._trigrams = {};

    /**
     * stores the trigram ranks of the sample
     *
     * @access  private
     * @var     array
     */
   this._trigram_ranks = {};

    /**
     * stores the unicode blocks of the sample
     *
     * @access  private
     * @var     array
     */
   this._unicode_blocks = {};
    
    /**
     * Whether the parser should compile the unicode ranges
     * 
     * @access  private
     * @var     bool
     */
   this._compile_unicode = true;

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

    /**
     * Whether the unicode parser should skip non-alphabetical ascii chars
     *
     * @access  private
     * @var     bool
     */
   this._unicode_skip_symbols = true;


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
     * @param   string  $string     string to be parsed
     */
    this._string = string;
};

Parser.prototype = {
    /**
     * turn on/off padding the beginning of the sample string
     *
     * @access  public
     * @param   bool    $bool true for on, false for off
     */
    setPadStart: function(_bool){
        var bool = _bool || true;

        this._trigram_pad_start = bool;
    }

    /**
     * Returns the trigram ranks for the text sample
     *
     * @access  public
     * @return  array    trigram ranks in the text sample
     */
    , getTrigramRanks: function(){
        return this._trigram_ranks;
    }

    /**
     * returns the array of unicode blocks
     *
     * @access  public
     * @return  array   unicode blocks in the text sample
     */
    , getUnicodeBlocks: function(){
        return this._unicode_blocks;
    }

    /**
     * Searches the unicode block database
     *
     * Returns the block name for a given unicode value. unicodeBlockName() is
     * the public interface for this function, which does input checks which
     * this function omits for speed.
     *
     * @access  protected
     * @param   int     $unicode the unicode value
     * @param   array   &$blocks the block database
     * @param   int     $block_count the number of defined blocks in the database
     * @see     unicodeBlockName()
     */
    , _unicode_block_name: function(unicode, blocks, _block_count) {
        var block_count = _block_count || -1
        ,   high = null, low = null;

        // for a reference, see 
        // http://www.unicode.org/Public/UNIDATA/Blocks.txt

        // assume that ascii characters are the most common
        // so try it first for efficiency
        if (unicode <= blocks[0][1]) {
            return blocks[0];
        }

        // the optional $block_count param is for efficiency
        // so we this function doesn't have to run count() every time
        if (block_count != -1) {
            high = block_count - 1;
        } else {
            high = blocks.length - 1;
        }

        low = 1; // start with 1 because ascii was 0

        // your average binary search algorithm
        while (low <= high) {
            var mid = Math.floor((low + high) / 2);

            // if it's lower than the lower bound
            if (unicode < blocks[mid][0]) {
                high = mid - 1;

            // if it's higher than the upper bound
            } else if (unicode > blocks[mid][1]) {
                low = mid + 1;

            // found it
            } else {
                return blocks[mid];
            }
        }

        // failed to find the block 
        return -1;

        // todo: differentiate when it's out of range or when it falls 
        //       into an unassigned range?
    }


    , _getBlockCount: function(){
        return db_unicode_blocks.length;
    }

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
    , analyze: function(){
        var len = this._string.length
        ,   byte_counter = 0
        ,   block_count = 0
        ,   blocks = null
        ,   block_count = 0
        ,   skipped_count = 0
        ,   unicode_chars = {}
        ,   a = ' '
        ,   b = ' '
        ,   dropone
        ,   tmp;


        // unicode startup
        if (this._compile_unicode) {
            blocks = db_unicode_blocks;

            block_count = blocks.length;

            skipped_count = 0;
            unicode_chars = {};
        }

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
                tmp = this._next_char(this._string, byte_counter, true);
                byte_counter = tmp[0];
                a = tmp[1];

                if (a != ' ') {
                    tmp = this._next_char(this._string, byte_counter, true);
                    byte_counter = tmp[0];
                    b = tmp[1];

                    dropone = ' '+a+b;
                }

                byte_counter = 0;
                a = ' ';
                b = ' ';
            }
        }

        while (byte_counter < len) {


            tmp = this._next_char(this._string, byte_counter, true);
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

            // unicode block detection
            if (this._compile_unicode) {
                if (this._unicode_skip_symbols
                        && _char.length == 1
                        && (_char < 'A' || _char > 'z'
                        || (_char > 'Z' && _char < 'a'))
                        && _char != "'") {  // does not skip the apostrophe
                                            // since it's included in the language
                                            // models

                    skipped_count++;
                    continue;
                }

                // build an array of all the _characters
                if (typeof unicode_chars[_char] != 'undefined') {
                    unicode_chars[_char]++;
                } else {
                    unicode_chars[_char] = 1;
                }
            }

            // todo: add byte detection here
        }

        // unicode cleanup
        if (this._compile_unicode) {
            for (var utf8_char in unicode_chars) {
                var count = unicode_chars[utf8_char]
                ,   block_name = null
                ,   search_result = this._unicode_block_name(this._utf8char2unicode(utf8_char), blocks, block_count);

                if (search_result != -1) {
                    block_name = search_result[2];
                } else {
                    block_name = '[Malformatted]';
                }

                if (typeof this._unicode_blocks[block_name] != 'undefined') {
                    this._unicode_blocks[block_name] += count;
                } else {
                    this._unicode_blocks[block_name] = count;
                }
            }
        }


        // trigram cleanup
        if (this._compile_trigram) {
            // pad the end
            if (b != ' ') {
                if (!this._trigram[a+b+' ']) {
                    this._trigram[a+b+' '] = 1;
                } else {
                    this._trigram[a+b+' ']++;
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
    }

    /**
     * utf8-safe fast character iterator
     *
     * Will get the next character starting from $counter, which will then be
     * incremented. If a multi-byte char the bytes will be concatenated and 
     * $counter will be incremeted by the number of bytes in the char.
     *
     * @access  private
     * @param   string  &$str        the string being iterated over
     * @param   int     &$counter    the iterator, will increment by reference
     * @param   bool    $special_convert whether to do special conversions
     * @return  char    the next (possibly multi-byte) char from $counter
     */
    , _next_char: function(str, counter, _special_convert){
        var special_convert = _special_convert || false;

        //console.log('counter=', counter);
        var _char = str.charAt(counter++);
        //console.log('char=', _char)
        //console.log('counter=', counter);
        var ord = php.ord(_char);
        //console.log('ord=', ord);

        // for a description of the utf8 system see
        // http://www.phpclasses.org/browse/file/5131.html

        // normal ascii one byte char
        if (ord <= 127) {
            // special conversions needed for this package
            // (that only apply to regular ascii characters)
            // lower case, and convert all non-alphanumeric characters
            // other than "'" to space
            if (special_convert && _char != ' ' && _char != "'") {
                if (ord >= 65 && ord <= 90) { // A-Z
                    _char = php.chr(ord + 32); // lower case
                } else if (ord < 97 || ord > 122) { // NOT a-z
                    _char = ' '; // convert to space
                }
            }

            return [counter, _char];

        // multi-byte chars
        } else if (ord >> 5 == 6) { // two-byte char
            nextchar = str[counter++]; // get next byte

            // lower-casing of non-ascii characters is still incomplete

            if (special_convert) {
                // lower case latin accented characters
                if (ord == 195) {
                    nextord = php.ord(nextchar);
                    nextord_adj = nextord + 64;
                    // for a reference, see 
                    // http://www.ramsch.org/martin/uni/fmi-hp/iso8859-1.html

                    // &Agrave; - &THORN; but not &times;
                    if (    nextord_adj >= 192
                            && nextord_adj <= 222 
                            && nextord_adj != 215) {

                        nextchar = php.chr(nextord + 32); 
                    }

                // lower case cyrillic alphabet
                } else if (ord == 208) {
                    nextord = php.ord(nextchar);
                    // if A - Pe
                    if (nextord >= 144 && nextord <= 159) {
                        // lower case
                        nextchar = php.chr(nextord + 32);

                    // if Er - Ya
                    } else if (nextord >= 160 && nextord <= 175) {
                        // lower case
                        _char = php.chr(209); // == $ord++
                        nextchar = php.chr(nextord - 32);
                    }
                }
            }

            // tag on next byte
            return [counter, _char + nextchar]; 

        } else if (ord >> 4  == 14) { // three-byte char
            
            // tag on next 2 bytes
            var ret = _char + str[counter++] + str[counter++]; 
            return [counter, ret];

        } else if (ord >> 3 == 30) { // four-byte _char

            // tag on next 3 bytes
            var ret = _char + str[counter++] + str[counter++] + str[counter++];
            return [counter, ret];

        } else {
            // error?
            // FIXME
            return [counter, ' '];
        }
    }

    /**
     * Returns the unicode value of a utf8 char
     *
     * @access  protected
     * @param   string $char a utf8 (possibly multi-byte) char
     * @return  int          unicode value or -1 if malformatted
     */
    , _utf8char2unicode: function(_char) {

        // strlen() here will actually get the binary length of a single _char
         switch(_char.length) {

            // for a reference, see http://en.wikipedia.org/wiki/UTF-8

             case 1:
                // normal ASCII-7 byte
                // 0xxxxxxx -->  0xxxxxxx
                return php.ord(_char[0]);

             case 2:
                // 2 byte unicode
                // 110zzzzx 10xxxxxx --> 00000zzz zxxxxxxx
                var z = (php.ord(_char[0]) & 0x000001F) << 6;
                var x = (php.ord(_char[1]) & 0x0000003F);

                return (z | x);

             case 3:
                // 3 byte unicode
                // 1110zzzz 10zxxxxx 10xxxxxx --> zzzzzxxx xxxxxxxx 
                var z =  (php.ord(_char[0]) &0x0000000F) << 12;
                var x1 = (php.ord(_char[1]) & 0x0000003F) << 6;
                var x2 = (php.ord(_char[2]) & 0x0000003F);

                return (z | x1 | x2);

             case 4:
                // 4 byte unicode
                // 11110zzz 10zzxxxx 10xxxxxx 10xxxxxx -->
                // 000zzzzz xxxxxxxx xxxxxxxx
                var z1 = (php.ord(_char[0]) & 0x00000007) << 18;
                var z2 = (php.ord(_char[1]) & 0x0000003F) << 12;
                var x1 = (php.ord(_char[2]) & 0x0000003F) << 6;
                var x2 = (php.ord(_char[3]) & 0x0000003F);

                return (z1 | z2 | x1 | x2);

            default:            
                // error: malformatted char?
                return -1;
        }
    }

    /**
     * Sorts an array by value breaking ties alphabetically
     * 
     * @access   private
     * @param    array     &$arr     the array to sort
     */
    , _bub_sort: function(arr){
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

        combined = php.usort(combined, this._sort_func);

        var replacement = {};

        for (var key in combined) {
            var value = combined[key]
            ,   new_key = value[0]
            ,   new_value = value[1];

            replacement[new_key] = new_value;
        }

        return replacement;
    }

    /**
     * Converts a set of trigrams from frequencies to ranks
     *
     * Thresholds (cuts off) the list at $this->_threshold
     *
     * @access    protected
     * @param     array     $arr     array of trgram 
     * @return    array              ranks of trigrams
     */
    , _arr_rank: function(arr){

        // sorts alphabetically first as a standard way of breaking rank ties
        arr = this._bub_sort(arr);

        // below might also work, but seemed to introduce errors in testing
        //ksort($arr);
        //asort($arr);

        var rank = {}, i = 0;

        for (var key in arr) {
            var value = arr[key];
            rank[key] = i++;

            // cut off at a standard threshold
            if (i >= this._threshold) {
                break;
            }
        }

        return rank;
    }

    /**
     * Sort function used by bubble sort
     *
     * Callback function for usort(). 
     *
     * @access   private
     * @param    array        first param passed by usort()
     * @param    array        second param passed by usort()
     * @return   int          1 if $a is greater, -1 if not
     * @see      _bub_sort()
     */
    , _sort_func: function(a, b){
        // each is actually a key/value pair, so that it can compare using both
        var a_key = a[0]
        ,   a_value = a[1]
        ,   b_key = b[0]
        ,   b_value = b[1];

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