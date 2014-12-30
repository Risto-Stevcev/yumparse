/* 
 * Demonstrate type-checking the Object type 
 * node object.js -f '{"foo":2}'
 * node object.js -f 'bar'
 */
var yum = require('yumparse');

var parser = new yum.Parser({
  options: [
    { shortFlag: '-f',
      type: Object,
      description: 'The foo JSON object' }
  ]
});

parser.parse();

if (parser.parsedOptions.f)
  console.log('The object contents: ' + JSON.stringify(parser.parsedOptions.f.value)); 
