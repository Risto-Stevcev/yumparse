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


describe('rules', function() {
  'use strict';
  var parser, ruleOptions; 
  before(function() {
    ruleOptions = sampleOptions.slice(0,3);
    ruleOptions.should.be.an.Array.and.have.lengthOf(3);
    ruleOptions[0].should.have.property('longFlag').equal('--append-boolean');
    ruleOptions[1].should.have.property('longFlag').equal('--append-number');
    ruleOptions[2].should.have.property('longFlag').equal('--append-string');
  });


  var orFlagsTests = function() {
    it('should succeed if only one of the required flags is given', function() {
      processArgv(['-s', 'foo']);
      parser.parse();
      parser.parsedOptions.should.be.an.Object
        .and.not.be.empty.and.have.property('s')
        .with.property('value').equal('foo');
    });

    it('should fail if more than one of the required flags is given', function() {
      processArgv(['-n', '24', '-s', 'foo']);
      (function() {
        parser.parse()
      }).should.throw(/You [a-z ]* pass .* as a parameter/);
    });
  };


  describe('rules.requiredOrFlags', function() {
    afterEach(function() {
      parser = undefined;
    });


    var requiredOrFlagsTests = function() {
      it('should fail if none of the required flags are given', function() {
        processArgv([]);
        (function() {
          parser.parse()
        }).should.throw(/You must pass either .* as a parameter/);
      });
    };


    describe('with two OR flags', function() {
      beforeEach(function() {
        parser = new yumparse.Parser({
          options: ruleOptions 
        });
        parser.addRule(yumparse.rules.requiredOrFlags('-s', '-n'));
        parser.parsedOptions.should.be.an.Object.and.be.empty;
      });
      requiredOrFlagsTests.call(this);
      orFlagsTests.call(this);
    });


    describe('with three OR flags', function() {
      beforeEach(function() {
        parser = new yumparse.Parser({
          options: ruleOptions 
        });
        parser.addRule(yumparse.rules.requiredOrFlags('-s', '-n', '-b'));
        parser.parsedOptions.should.be.an.Object.and.be.empty;
      });
      requiredOrFlagsTests.call(this);
      orFlagsTests.call(this);
    });
  });
  

  describe('rules.orFlags', function() {
    afterEach(function() {
      parser = undefined;
    });


    var basicOrFlagsTests = function() {
      it('should pass through if no flags are given', function() {
        processArgv([]);
        parser.parse();
        parser.parsedOptions.should.be.an.Object.and.be.empty;
      });
    };


    describe('with two OR flags', function() {
      beforeEach(function() {
        parser = new yumparse.Parser({
          options: ruleOptions 
        });
        parser.addRule(yumparse.rules.orFlags('-s', '-n'));
        parser.parsedOptions.should.be.an.Object.and.be.empty;
      });

      basicOrFlagsTests.call(this);
      orFlagsTests.call(this);
    });


    describe('with three OR flags', function() {
      beforeEach(function() {
        parser = new yumparse.Parser({
          options: ruleOptions 
        });
        parser.addRule(yumparse.rules.orFlags('-s', '-n', '-b'));
        parser.parsedOptions.should.be.an.Object.and.be.empty;
      });
      basicOrFlagsTests.call(this);
      orFlagsTests.call(this);
    });
  });


  describe('rules.andFlags', function() {
    afterEach(function() {
      parser = undefined;
    });


    describe('with two AND flags', function() {
      beforeEach(function() {
        parser = new yumparse.Parser({
          options: ruleOptions 
        });
        parser.addRule(yumparse.rules.andFlags('-s', '-n'));
        parser.parsedOptions.should.be.an.Object.and.be.empty;
      });

      it('should fail if no flags are given', function() {
        processArgv([]);
        (function() {
          parser.parse()
        }).should.throw(/You must pass parameters .* together/);
      });

      it('should fail if less than all of the flags are given', function() {
        processArgv(['-s', 'foo']);
        (function() {
          parser.parse()
        }).should.throw(/You must pass parameters .* together/);
      });

      it('should succeed if all of the flags are given', function() {
        processArgv(['-s', 'foo', '-n', '24']);
        parser.parse();
        parser.parsedOptions.should.be.an.Object
          .and.have.property('s').with.property('value', 'foo');
        parser.parsedOptions.should.have.property('n').with.property('value', 24);
      });
    });


    describe('with three AND flags', function() {
      beforeEach(function() {
        parser = new yumparse.Parser({
          options: ruleOptions 
        });
        parser.addRule(yumparse.rules.andFlags('-s', '-n', '-b'));
        parser.parsedOptions.should.be.an.Object.and.be.empty;
      });

      it('should fail if no flags are given', function() {
        processArgv([]);
        (function() {
          parser.parse()
        }).should.throw(/You must pass parameters .* together/);
      });

      it('should fail if less than all of the flags are given', function() {
        processArgv(['-s', 'foo', '-n', '24']);
        (function() {
          parser.parse()
        }).should.throw(/You must pass parameters .* together/);
      });

      it('should succeed if all of the flags are given', function() {
        processArgv(['-s', 'foo', '-n', '24', '-b']);
        parser.parse();
        parser.parsedOptions.should.be.an.Object
          .and.have.property('s').with.property('value', 'foo');
        parser.parsedOptions.should.have.property('n').with.property('value', 24);
        parser.parsedOptions.should.have.property('b').with.property('value', true);
      });
    });
  });


  describe('rules.fileExists', function() {
    var filePathParser;

    beforeEach(function() {
      filePathParser = new yumparse.Parser({
        options: [
          { shortFlag: '-i', type: String, description: 'input' },
          { shortFlag: '-o', type: String, description: 'output' },
          { shortFlag: '-l', type: String, description: 'log' },
          { shortFlag: '-m', type: Array, description: 'multiple inputs' }
        ]
      })
    });


    describe('with a single flag', function() {
      it('should return false if the string points to a valid file path', function() {
        processArgv(['-i', '']);
        filePathParser.addRule(yumparse.rules.fileExists('-i'));
        (function() {
          filePathParser.parse()
        }).should.throw(/One of the following file paths .* does not exist/);
      });

      it('should return true if the string points to a valid file path', function() {
        processArgv(['-i', __filename]);
        filePathParser.addRule(yumparse.rules.fileExists('-i'));
        filePathParser.parse();
        filePathParser.parsedOptions.should.be.an.Object
          .and.have.property('i').with.property('value', __filename);
      });

      it('should return false if the string does not point to a valid file path', function() {
        processArgv(['-i', __dirname + '/blah']);
        filePathParser.addRule(yumparse.rules.fileExists('-i'));
        (function() {
          filePathParser.parse()
        }).should.throw(/One of the following file paths .* does not exist/);
      });
    });


    describe('with multiple flags', function() {
      it('should return true if the string points to a valid file path', function() {
        processArgv(['-i', __filename, 
                     '-o', __dirname, 
                     '-l', __dirname + '/yumparse.test.js']);
        filePathParser.addRule(yumparse.rules.fileExists('-i', '-o', '-l'));
        filePathParser.parse();
        filePathParser.parsedOptions.should.be.an.Object
          .and.have.property('i').with.property('value', __filename);
        filePathParser.parsedOptions.should.have.property('o')
          .with.property('value', __dirname);
        filePathParser.parsedOptions.should.have.property('l')
          .with.property('value', __dirname + '/yumparse.test.js');
      });

      it('should return false if the string does not point to a valid file path', function() {
        processArgv(['-i', __filename, '-o', __dirname + '/blah', '-l', __dirname]);
        filePathParser.addRule(yumparse.rules.fileExists('-i', '-o', '-l'));
        (function() {
          filePathParser.parse()
        }).should.throw(/One of the following file paths .* does not exist/);
      });
    });


    describe('with multiple file paths', function() {
      it('should return true if multiple file paths are given that exist', function() {
        processArgv(['-m', __filename, __dirname]);
        filePathParser.addRule(yumparse.rules.fileExists('-m'));
        filePathParser.parse();
        filePathParser.parsedOptions.should.be.an.Object.and.have.property('m')
          .with.property('value', [__filename, __dirname]).of.an.Array;
      });

      it('should fail if multiple file paths are given and one or more do not exist', function() {
        processArgv(['-m', __filename, __dirname, __dirname + '/blah']);
        filePathParser.addRule(yumparse.rules.fileExists('-m'));
        (function() {
          filePathParser.parse()
        }).should.throw(/One of the following file paths .* does not exist/);
      });
    });
  });


  describe('rules.andFlagSets', function() {
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


    it('should succeed if a flag in a single flag set is given', function() {
      processArgv(['-a']);
      flagSetsParser.addRule(yumparse.rules.andFlagSets(['-a', '-b', '-c']));
      flagSetsParser.parse();
      flagSetsParser.parsedOptions.should.be.an.Object
        .and.have.property('a').with.property('value', true);
    });

    it('should succeed if a flag in each flag set is given', function() {
      processArgv(['-b', '-d', '-e']);
      flagSetsParser.addRule(yumparse.rules.andFlagSets(['-a', '-b', '-c'], 
                                                        ['-d'], 
                                                        ['-e', '-f']));
      flagSetsParser.parse();
      flagSetsParser.parsedOptions.should.be.an.Object
        .and.have.property('b').with.property('value', true);
      flagSetsParser.parsedOptions.should.have.property('d')
        .with.property('value', true);
      flagSetsParser.parsedOptions.should.have.property('e')
        .with.property('value', true);
    });

    it('should fail if a flag in one of the flag sets is not given', function() {
      processArgv(['-b', '-d']);
      flagSetsParser.addRule(yumparse.rules.andFlagSets(['-a', '-b', '-c'], 
                                                        ['-d'], 
                                                        ['-e', '-f']));
      (function() {
        flagSetsParser.parse()
      }).should.throw(/flag must be passed from each set/);
    });

    it('should fail if two flags from the same set is given', function() {
      processArgv(['-a', '-b', '-d', '-e']);
      flagSetsParser.addRule(yumparse.rules.andFlagSets(['-a', '-b', '-c'], 
                                                        ['-d'], 
                                                        ['-e', '-f']));
      (function() {
        flagSetsParser.parse()
      }).should.throw(/flag must be passed from each set/);
    });
  });
});
