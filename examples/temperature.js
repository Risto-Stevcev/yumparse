/* 
 * Demonstrate using the yumparse.rules.requiredOrFlags rule
 */
var yum = require('yumparse');

var parser = new yum.Parser({
  options: [
    { shortFlag: '-v',
      longFlag: '--verbose',
      type: Boolean,
      description: 'Verbose output' },

    { shortFlag: '-f',
      longFlag: '--fahrenheit',
      type: Number,
      description: 'Convert celsius to fahrenheit' },
      
    { shortFlag: '-c',
      longFlag: '--celsius',
      type: Number,
      description: 'Convert fahrenheit to celsius' },

    { shortFlag: '-k',
      longFlag: '--kelvin',
      type: Number,
      description: 'Convert kelvin to fahrenheit' }
  ],
  program: {
    name: 'foobar',
    description: 'a very fooish barish bazish program'
  }
});

parser.addRule(yum.rules.requiredOrFlags('--fahrenheit', '--celsius', '--kelvin'));

try {
  parser.parse();
}
catch (e) {
  console.error(e.name + ': ' + e.message);
  process.exit(1);
}

if (parser.parsedOptions.v || parser.parsedOptions.verbose) {
  console.log('parser.options:\n', parser.options, '\n');
  console.log('parser.parsedOptions:\n', parser.parsedOptions, '\n');
}

var fahrenheit = parser.parsedOptions.f || parser.parsedOptions.fahrenheit;
var celsius = parser.parsedOptions.celsius || parser.parsedOptions.c;
var kelvin = parser.parsedOptions.kelvin || parser.parsedOptions.k;

if (fahrenheit)
  console.log((fahrenheit.value - 32) * 5/9 +  '° celsius');
else if (celsius)
  console.log(celsius.value * 9/5 + 32 + '° fahrenheit');
else if (kelvin)
  console.log((kelvin.value - 273.15) * 9/5 + 32 + '° fahrenheit');

