# Node Language Detect [![Build Status](https://secure.travis-ci.org/FGRibreau/node-language-detect.png)](http://travis-ci.org/FGRibreau/node-language-detect) #
`LanguageDetect` is a port of the [PEAR::Text_LanguageDetect](http://pear.php.net/package/Text_LanguageDetect) for [node.js](http://nodejs.org).

LanguageDetect can identify 52 human languages from text samples and return confidence scores for each.

### Installation

This package can be installed via [npm](http://npmjs.org/) as follows

    % npm install languagedetect

### Example
    
    var LanguageDetect = require('languagedetect');
    var lngDetector = new LanguageDetect();

    // OR
    // var lngDetector = new (require('languagedetect'));

    console.log(lngDetector.detect('This is a test.'));

    /*
      [ [ 'english', 0.5969230769230769 ],
      [ 'hungarian', 0.407948717948718 ],
      [ 'latin', 0.39205128205128204 ],
      [ 'french', 0.367948717948718 ],
      [ 'portuguese', 0.3669230769230769 ],
      [ 'estonian', 0.3507692307692307 ],
      [ 'latvian', 0.2615384615384615 ],
      [ 'spanish', 0.2597435897435898 ],
      [ 'slovak', 0.25051282051282053 ],
      [ 'dutch', 0.2482051282051282 ],
      [ 'lithuanian', 0.2466666666666667 ],
      ... ]
    */
    
    // Only get the first 2 results
    console.log(lngDetector.detect('This is a test.', 2));

    /*
      [ [ 'english', 0.5969230769230769 ], [ 'hungarian', 0.407948717948718 ] ]
    */

### API

   * `detect(sample, limit)` Detects the closeness of a sample of text to the known languages
   * `getLanguages()` Returns the list of detectable languages
   * `getLanguageCount()` Returns the number of languages that the lib can detect

### Benchmark

`node.js` 1000 items processed in 1.277 secs (482 with a score > 0.2)`
`PHP` 1000 items processed in 4.835 secs (535 with a score > 0.2)`

### Credits

Nicholas Pisarro for his work on [PEAR::Text_LanguageDetect](http://pear.php.net/package/Text_LanguageDetect)