/*
 * Basic usage
 */
var yum = require('yumparse');
var parser = new yum.Parser({
  // Enter command line options: shortFlag, type, and description are required parameters 
  options: [
    { shortFlag: '-f',
      longFlag: '--foo',
      type: String,
      description: 'The foo string' }
  ]
});
try {
  parser.parse();
}
catch (error) {
  if (error.message.match(/\w is not a string/))
    console.error(error.name + ': Please enter a string');
  else
    console.error(error.name + ': ' + error.message);
  process.exit(1);
}
  
var fooString = parser.parsedOptions.foo || parser.parsedOptions.f;  // Get the option if it was passed
if (fooString)  // Do something with the option if it exists
  console.log('Hello ' + fooString.value + '!');
