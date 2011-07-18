var php = module.exports = {
  unserialize: function (data) {
      var that = php;
      var utf8Overhead = function (chr) {
              var code = chr.charCodeAt(0);
              if (code < 0x0080) {
                  return 0;
              }
              if (code < 0x0800) {
                  return 1;
              }
              return 2;
          };
      var error = function (type, msg, filename, line) {
              throw new that.window[type](msg, filename, line);
          };
      var read_until = function (data, offset, stopchr) {
              var buf = [];
              var chr = data.slice(offset, offset + 1);
              var i = 2;
              while (chr != stopchr) {
                  if ((i + offset) > data.length) {
                      error('Error', 'Invalid');
                  }
                  buf.push(chr);
                  chr = data.slice(offset + (i - 1), offset + i);
                  i += 1;
              }
              return [buf.length, buf.join('')];
          };
      var read_chrs = function (data, offset, length) {
              var buf;
              buf = [];
              for (var i = 0; i < length; i++) {
                  var chr = data.slice(offset + (i - 1), offset + i);
                  buf.push(chr);
                  length -= utf8Overhead(chr);
              }
              return [buf.length, buf.join('')];
          };
      var _unserialize = function (data, offset) {
              var readdata;
              var readData;
              var chrs = 0;
              var ccount;
              var stringlength;
              var keyandchrs;
              var keys;
              if (!offset) {
                  offset = 0;
              }
              var dtype = (data.slice(offset, offset + 1)).toLowerCase();
              var dataoffset = offset + 2;
              var typeconvert = function (x) {
                      return x;
                  };
              switch (dtype) {
              case 'i':
                  typeconvert = function (x) {
                      return parseInt(x, 10);
                  };
                  readData = read_until(data, dataoffset, ';');
                  chrs = readData[0];
                  readdata = readData[1];
                  dataoffset += chrs + 1;
                  break;
              case 'b':
                  typeconvert = function (x) {
                      return parseInt(x, 10) !== 0;
                  };
                  readData = read_until(data, dataoffset, ';');
                  chrs = readData[0];
                  readdata = readData[1];
                  dataoffset += chrs + 1;
                  break;
              case 'd':
                  typeconvert = function (x) {
                      return parseFloat(x);
                  };
                  readData = read_until(data, dataoffset, ';');
                  chrs = readData[0];
                  readdata = readData[1];
                  dataoffset += chrs + 1;
                  break;
              case 'n':
                  readdata = null;
                  break;
              case 's':
                  ccount = read_until(data, dataoffset, ':');
                  chrs = ccount[0];
                  stringlength = ccount[1];
                  dataoffset += chrs + 2;
                  readData = read_chrs(data, dataoffset + 1, parseInt(stringlength, 10));
                  chrs = readData[0];
                  readdata = readData[1];
                  dataoffset += chrs + 2;
                  if (chrs != parseInt(stringlength, 10) && chrs != readdata.length) {
                      error('SyntaxError', 'String length mismatch');
                  }
                  readdata = php.utf8_decode(readdata);
                  break;
              case 'a':
                  readdata = {};
                  keyandchrs = read_until(data, dataoffset, ':');
                  chrs = keyandchrs[0];
                  keys = keyandchrs[1];
                  dataoffset += chrs + 2;
                  for (var i = 0; i < parseInt(keys, 10); i++) {
                      var kprops = _unserialize(data, dataoffset);
                      var kchrs = kprops[1];
                      var key = kprops[2];
                      dataoffset += kchrs;
                      var vprops = _unserialize(data, dataoffset);
                      var vchrs = vprops[1];
                      var value = vprops[2];
                      dataoffset += vchrs;
                      readdata[key] = value;
                  }
                  dataoffset += 1;
                  break;
              default:
                  error('SyntaxError', 'Unknown / Unhandled data type(s): ' + dtype);
                  break;
              }
              return [dtype, dataoffset - offset, typeconvert(readdata)];
          };
      return _unserialize((data + ''), 0)[2];
  },

  utf8_decode: function (str_data) {
      var tmp_arr = [],
          i = 0,
          ac = 0,
          c1 = 0,
          c2 = 0,
          c3 = 0;
      str_data += '';
      while (i < str_data.length) {
          c1 = str_data.charCodeAt(i);
          if (c1 < 128) {
              tmp_arr[ac++] = String.fromCharCode(c1);
              i++;
          } else if (c1 > 191 && c1 < 224) {
              c2 = str_data.charCodeAt(i + 1);
              tmp_arr[ac++] = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
              i += 2;
          } else {
              c2 = str_data.charCodeAt(i + 1);
              c3 = str_data.charCodeAt(i + 2);
              tmp_arr[ac++] = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
              i += 3;
          }
      }
      return tmp_arr.join('');
  }
  , usort: function(inputArr, sorter) {
      // http://kevin.vanzonneveld.net
      // +   original by: Brett Zamir (http://brett-zamir.me)
      // +   improved by: Brett Zamir (http://brett-zamir.me)
      // %        note 1: This function deviates from PHP in returning a copy of the array instead
      // %        note 1: of acting by reference and returning true; this was necessary because
      // %        note 1: IE does not allow deleting and re-adding of properties without caching
      // %        note 1: of property position; you can set the ini of "phpjs.strictForIn" to true to
      // %        note 1: get the PHP behavior, but use this only if you are in an environment
      // %        note 1: such as Firefox extensions where for-in iteration order is fixed and true
      // %        note 1: property deletion is supported. Note that we intend to implement the PHP
      // %        note 1: behavior by default if IE ever does allow it; only gives shallow copy since
      // %        note 1: is by reference in PHP anyways
      // *     example 1: stuff = {d: '3', a: '1', b: '11', c: '4'};
      // *     example 1: stuff = usort(stuff, function (a, b) {return(a-b);});
      // *     results 1: stuff = {0: '1', 1: '3', 2: '4', 3: '11'};
      var valArr = [],
          k = '',
          i = 0,
          strictForIn = false,
          populateArr = {};

      if (typeof sorter === 'string') {
          sorter = this[sorter];
      } else if (Object.prototype.toString.call(sorter) === '[object Array]') {
          sorter = this[sorter[0]][sorter[1]];
      }

      // BEGIN REDUNDANT
      this.php_js = this.php_js || {};
      this.php_js.ini = this.php_js.ini || {};
      // END REDUNDANT
      strictForIn = this.php_js.ini['phpjs.strictForIn'] && this.php_js.ini['phpjs.strictForIn'].local_value && this.php_js.ini['phpjs.strictForIn'].local_value !== 'off';
      populateArr = strictForIn ? inputArr : populateArr;


      for (k in inputArr) { // Get key and value arrays
          if (inputArr.hasOwnProperty(k)) {
              valArr.push(inputArr[k]);
              if (strictForIn) {
                  delete inputArr[k];
              }
          }
      }
      try {
          valArr.sort(sorter);
      } catch (e) {
          return false;
      }
      for (i = 0; i < valArr.length; i++) { // Repopulate the old array
          populateArr[i] = valArr[i];
      }

      return strictForIn || populateArr;
  }

  , abs: function (mixed_number) {
     return Math.abs(mixed_number) || 0;
  }

  , chr: function (codePt) {
    if (codePt > 0xFFFF) {
        codePt -= 0x10000;
        return String.fromCharCode(0xD800 + (codePt >> 10), 0xDC00 + (codePt & 0x3FF));
    }
    return String.fromCharCode(codePt);
   }

   , ord: function (string) {
      var str = string + '',
          code = str.charCodeAt(0);
      if (0xD800 <= code && code <= 0xDBFF) {
          var hi = code;
          if (str.length === 1) {
              return code;
          }
          var low = str.charCodeAt(1);
          return ((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000;
      }
      if (0xDC00 <= code && code <= 0xDFFF) {
          return code;
      }
      return code;
    }

}