/* 
 * Demonstrate using the yumparse.rules.andFlags rule
 */
var yum = require('yumparse');

var parser = new yum.Parser({
  options: [
    { shortFlag: '-f',
      longFlag: '--first-name',
      type: String,
      description: 'First name' },
      
    { shortFlag: '-l',
      longFlag: '--last-name',
      type: String,
      description: 'Last name' }
  ]
});

parser.addRule(yum.rules.andFlags('--first-name', '--last-name'));

try {
  parser.parse();
}
catch (e) {
  console.error(e.name + ': ' + e.message);
  process.exit(1);
}

var firstName = parser.parsedOptions.firstName || parser.parsedOptions.f;
var lastName = parser.parsedOptions.lastName || parser.parsedOptions.l;

console.log('Hello ' + firstName.value + ' ' + lastName.value + '!');
