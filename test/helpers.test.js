var should = require('should');
var yumparse = require('../src/yumparse.js');

var processArgv = function(args) {
  process.argv = process.argv.slice(0, 2).concat(args);
};

var sampleOptions = [
  { shortFlag: '-b', 
    longFlag: '--append-boolean',
    type: Boolean,
    description: 'Boolean to append' },

  { shortFlag: '-n', 
    longFlag: '--append-number',
    type: Number,
    description: 'Number to append' },

  { shortFlag: '-s', 
    longFlag: '--append-string',
    type: String,
    description: 'String to append' },

  { shortFlag: '-a', 
    longFlag: '--array-to-append',
    type: Array,
    description: 'Array to append to',
    defaultValue: [] },

  { shortFlag: '-o', 
    type: Object,
    description: 'JSON object to append to' }
];


describe('helpers', function() {
  'use strict';
  var parser;
  before(function() {
    parser = new yumparse.Parser({
      options: sampleOptions
    });
  });


  describe('helpers.argsToOptions', function() {
    afterEach(function() {
      parser.parsedOptions = {};
    });

    it('should be return an empty string if an empty list is passed', function() {
      yumparse.helpers.argsToOptions.call(parser, [])
        .should.be.a.String.and.be.empty;
    });

    it('should return a formatted string if a non-empty list is passed', function() {
      yumparse.helpers.argsToOptions.call(parser, ['-n', '-s', '-a'])
        .should.be.a.String
        .and.is.equal('[-n | --append-number] or ' + 
                      '[-s | --append-string] or ' +
                      '[-a | --array-to-append]');
    });

    it('should return a formatted string with a custom delimiter if it is passed', function() {
      yumparse.helpers.argsToOptions.call(parser, ['-n', '-s', '-a'], ', ')
        .should.be.a.String
        .and.is.equal('[-n | --append-number], ' + 
                      '[-s | --append-string], ' +
                      '[-a | --array-to-append]');
    });
  });


  describe('helpers.allFlagsPassed', function() {
    afterEach(function() {
      parser.parsedOptions = {};
    });

    it('should return true if the list is empty', function() {
      processArgv([]);
      parser.parse();
      yumparse.helpers.allFlagsPassed.call(parser, []).should.be.true;
      parser.parsedOptions = {};
    });

    it('should return false if all flags are not passed', function() {
      processArgv(['-n', '24', '-s', 'foo']);
      parser.parse();
      yumparse.helpers.allFlagsPassed.call(parser, ['-n', '-s', '-a']).should.be.false;
    });

    it('should return false if all flags are not passed and the args array is empty', function() {
      processArgv([]);
      parser.parse();
      yumparse.helpers.allFlagsPassed.call(parser, ['-n', '-s']).should.be.false;
    });

    it('should return true if the all options are passed', function() {
      processArgv(['-n', '24', '-s', 'foo', '-a', '2', '6']);
      parser.parse();
      yumparse.helpers.allFlagsPassed.call(parser, ['-n', '-s', '-a']).should.be.true;
    });
  });


  describe('helpers.oneFlagPassed', function() {
    beforeEach(function() {
      processArgv(['-n', '24', '-s', 'foo']);
      parser.parse();
    });

    afterEach(function() {
      parser.parsedOptions = {};
    });

    it('should return false if the list is empty', function() {
      yumparse.helpers.oneFlagPassed.call(parser, []).should.be.false;
    });

    it('should return true if one flag is passed', function() {
      yumparse.helpers.oneFlagPassed.call(parser, ['-n']).should.be.true;
    });

    it('should return false if more than one is passed', function() {
      yumparse.helpers.oneFlagPassed.call(parser, ['-n', '-s']).should.be.false;
    });
  });


  describe('helpers.isFilePath', function() {
    var filePathParser;
    beforeEach(function() {
      filePathParser = new yumparse.Parser({
        options: [
          { shortFlag: '-i', type: String, description: 'input' },
          { shortFlag: '-o', type: String, description: 'output' },
          { shortFlag: '-l', type: String, description: 'log' }
        ]
      })
    });


    describe('with a single flag', function() {
      it('should return true if the string points to a valid file path', function() {
        processArgv(['-i', __filename]);
        filePathParser.parse();
        yumparse.helpers.fileExists.call(filePathParser, ['-i']).should.be.true;
      });

      it('should return false if the string does not point to a valid file path', function() {
        processArgv(['-i', '']);
        filePathParser.parse();
        yumparse.helpers.fileExists.call(filePathParser, ['-i']).should.be.false;
      });
    });


    describe('with multiple flags', function() {
      it('should return true if the string points to a valid file path', function() {
        processArgv(['-i', __filename, '-o', __dirname, '-l', __dirname + '/yumparse.test.js']);
        filePathParser.parse();
        yumparse.helpers.fileExists.call(filePathParser, ['-i', '-o', '-l']).should.be.true;
      });

      it('should return false if the string does not point to a valid file path', function() {
        processArgv(['-i', __filename, '-o', '', '-l', __dirname]);
        filePathParser.parse();
        yumparse.helpers.fileExists.call(filePathParser, ['-i', '-o', '-l']).should.be.false;
      });
    });
  });


  describe('helpers.allFlagsSetsPassed', function() {
    var flagSetsParser;
    beforeEach(function() {
      flagSetsParser = new yumparse.Parser({
        options: [
          { shortFlag: '-a', type: Boolean, description: 'a' },
          { shortFlag: '-b', type: Boolean, description: 'b' },
          { shortFlag: '-c', type: Boolean, description: 'c' },
          { shortFlag: '-d', type: Boolean, description: 'd' },
          { shortFlag: '-e', type: Boolean, description: 'e' },
          { shortFlag: '-f', type: Boolean, description: 'f' }
        ]
      })
    });

    it('should return true if no flag sets are given', function() {
      processArgv([]);
      flagSetsParser.parse();
      yumparse.helpers.allFlagSetsPassed.call(flagSetsParser, []).should.be.true;
    });

    it('should return true if a flag in a single flag set is given', function() {
      processArgv(['-a']);
      flagSetsParser.parse();
      yumparse.helpers.allFlagSetsPassed.call(flagSetsParser, [['-a','-b','-c']]).should.be.true;
    });

    it('should return true if a flag in each flag set is given', function() {
      processArgv(['-b', '-d', '-e']);
      flagSetsParser.parse();
      yumparse.helpers.allFlagSetsPassed.call(flagSetsParser, [['-a','-b','-c'], ['-d'], ['-e', '-f']])
        .should.be.true;
    });

    it('should return false if a flag in one of the flag sets is not given', function() {
      processArgv(['-b', '-d']);
      flagSetsParser.parse();
      yumparse.helpers.allFlagSetsPassed.call(flagSetsParser, [['-a','-b','-c'], ['-d'], ['-e', '-f']])
        .should.be.false;
    });

    it('should return false if two flags from the same set is given', function() {
      processArgv(['-a', '-b', '-d', '-e']);
      flagSetsParser.parse();
      yumparse.helpers.allFlagSetsPassed.call(flagSetsParser, [['-a','-b','-c'], ['-d'], ['-e', '-f']])
        .should.be.false;
    });
  });
});
