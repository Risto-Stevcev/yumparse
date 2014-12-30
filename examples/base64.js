/* 
 * Demonstrate using the yumparse.rules.fileExists rule
 */
var yum = require('yumparse');
var fs = require('fs');

var parser = new yum.Parser({
  options: [
    { shortFlag: '-e',
      longFlag: '--encode',
      type: Boolean,
      description: 'Encode file(s)' },

    { shortFlag: '-d',
      longFlag: '--decode',
      type: Boolean,
      description: 'Decode file(s)' },

    { shortFlag: '-f',
      longFlag: '--file-paths',
      type: Array,
      required: true,
      description: 'File paths' }
  ]
});

parser.addRule(yum.rules.fileExists('--file-paths'));
parser.addRule(yum.rules.andFlagSets(['--encode', '--decode'],['--file-paths']));

try {
  parser.parse();
}
catch (e) {
  console.error(e.name + ': ' + e.message);
  process.exit(1);
}

var filePaths = parser.parsedOptions.filePaths || parser.parsedOptions.f;
var encode = parser.parsedOptions.encode || parser.parsedOptions.e;
var decode = parser.parsedOptions.decode || parser.parsedOptions.d;

if (filePaths)
  filePaths.value.forEach(function(filePath) {
    var string = fs.readFileSync(filePath, 'utf8')
    if (encode)
      string = new Buffer(string).toString('base64');
    else if (decode)
      string = new Buffer(string, 'base64').toString('utf8');
    console.log(string);
  });
