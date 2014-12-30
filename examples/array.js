/* 
 * Demonstrate type-checking the Array type 
 * node array.js -f 'foo' 'bar' 'baz' 'baa'
 * node array.js -f
 */
var yum = require('yumparse');

var parser = new yum.Parser({
  options: [
    { shortFlag: '-f',
      type: Array,
      description: 'The foo array' }
  ]
});

parser.parse();

if (parser.parsedOptions.f)
  console.log('The array contents: ' + JSON.stringify(parser.parsedOptions.f.value)); 
