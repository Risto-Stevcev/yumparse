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


describe('yumparse.Parser', function() {
  'use strict';
  var parser;

  var sampleOption = {
    shortFlag: '-o', 
    type: Object,
    description: 'JSON object to append to'
  };


  before(function() {
    parser = new yumparse.Parser({
      program: {
        name: process.argv[1],
        description: 'Foobar - A test for the yumparse parser'
      },
      example: function() {
        return this.name + ' -n 24';
      },
      options: sampleOptions 
    });
  });


  describe('defaults', function() {
    it('should fail to instantiate if no flags are given', function() {
      (function() {
        return new yumparse.Parser()
      }).should.throw(/flag needs to be given/);
    });

    it('should fail if options are not passed in as an array', function() {
      (function() {
        return new yumparse.Parser({ 
          options: { shortFlag: '-f', type: String, description: 'bar' }
        })
      }).should.throw(/Options must be passed in as an array/);
    });

    it('should have a stack trace if debug mode is turned on', function() {
      var requiredParser = new yumparse.Parser({
        debug: true,
        options: [{ shortFlag: '-f', type: String, description: 'bar', required: true }]
      });

      try {
        requiredParser.parse();
      }
      catch (e) {
        e.name.should.be.a.String.and.be.equal('YumparseError');
        e.message.should.be.a.String.and.not.be.empty;
        e.stack.should.be.a.String.and.not.be.empty;
      }
    });

    it('should fail to instantiate if the required flag fields are not given', function() {
      (function() {
        return new yumparse.Parser({ options: [{ type: String, description: 'bar' }]})
      }).should.throw(/requires .* at least shortFlag, type, and description attributes/);

      (function() {
        return new yumparse.Parser({ options: [{ shortFlag: 'foo', description: 'bar' }]})
      }).should.throw(/requires .* at least shortFlag, type, and description attributes/);

      (function() {
        return new yumparse.Parser({ options: [{ shortFlag: 'foo', type: String }]})
      }).should.throw(/requires .* at least shortFlag, type, and description attributes/);
    });

    it('should contain a default template', function() {
      parser.template.should.be.a.String.and.not.be.empty;
      parser.template.should.match(/Usage/).and.match(/Example/).and.match(/Options/);
    });

    it('should populate the program.name if it is not passed', function() {
      (new yumparse.Parser({ options: [sampleOption] })).program
        .should.have.properties(['name']).and.not.have.property('description');
    });

    it('should populate the program property name and description', function() {
      parser.program.should.have.properties(['name', 'description']);
    });

    it('should populate the example property if the property is passed in', function() {
      parser.example.should.be.a.Function;
      parser.example().should.be.a.String.and.not.be.empty;
      (new yumparse.Parser({ options: [sampleOption] })).should.not.have.property('example');
    });

    it('should replace the default template if the property is passed in', function() {
      (new yumparse.Parser({ options: [sampleOption], template: 'foo' })).template
        .should.be.a.String.and.not.equal(parser.template);
    });

    it('should populate the optionsList array with the given flags', function() {
      parser.optionsList.should.be.an.Array.and.have.lengthOf(sampleOptions.length);
    }); 

    it('should populate the flag type options', function() {
      parser.flagTypeOptions.should.be.an.Array
        .and.not.be.empty.and.eql([Boolean, Number, String, Array, Object]);
    });

    it('should fail if an invalid type is passed to a flag', function() {
      processArgv([]);
      (function() {
        var requiredParser = new yumparse.Parser({
          options: [{ shortFlag: '-f', type: RegExp, description: 'foo' }]
        });
        requiredParser.parse()
      }).should.throw(/The type given is not one of the valid types/);
    });

    it('should add required flags to requiredList', function() {
      processArgv([]);
      (function() {
        var requiredParser = new yumparse.Parser({
          options: [
            { shortFlag: '-f',
              type: Boolean,
              description: 'foo' },
            { shortFlag: '-z',
              type: Boolean,
              description: 'test required',
              required: true },
            { shortFlag: '-w',
              type: Number,
              description: 'test required number',
              required: true }
          ]
        });
        requiredParser.requiredList.should.be.an.Array
          .and.not.be.empty.and.have.lengthOf(2);
        requiredParser.parse();
      }).should.throwError(/Required flags .* were not given/);
    });
  });


  describe('flagToName', function() {
    it('should convert a short flag name to a variable name', function() {
      parser.flagToName('-i').should.equal('i');
    }); 

    it('should convert a long flag name to a variable name', function() {
      parser.flagToName('--array-to-append').should.equal('arrayToAppend');
    });
  });


  describe('nameToFlag', function() {
    it('should convert a variable name to a short flag name', function() {
      parser.nameToFlag('i').should.equal('-i');
    }); 

    it('should convert a variable name to a long flag name', function() {
      parser.nameToFlag('arrayToAppend').should.equal('--array-to-append');
    });
  });

  
  describe('options', function() {
    it('should contain all of the flags from optionsList', function() {
      parser.optionsList.forEach(function(option) {
        parser.options[parser.flagToName(option.shortFlag)].should.equal(option);

        if (option.longFlag)
          parser.options[parser.flagToName(option.longFlag)].should.equal(option);
      });
    }); 

    it('should handle default values', function() {
      var defaultParser = new yumparse.Parser({
        options: [
          { shortFlag: '-i', type: Boolean, description: 'foo', defaultValue: true }
        ]
      });
      defaultParser.parse();
      defaultParser.parsedOptions.i.should.be.an.Object
        .and.have.property('value').equal(true);
    });

    it('should handle default values for required flags', function() {
      var defaultParser = new yumparse.Parser({
        options: [
          { shortFlag: '-i', type: Number, description: 'foo', 
            defaultValue: 24, required: true }
        ]
      });
      defaultParser.parse();
      defaultParser.parse();
      defaultParser.parsedOptions.i.should.be.an.Object
        .and.have.property('value').equal(24);
    });
  });


  describe('helpString', function() {
    it('should return the help string rendered from the mustache template', function() {
      var mustacheBars = /{{[^}]*}}/;
      parser.helpString().should.be.a.String.and.not.match(mustacheBars);
    });
  });


  describe('parse', function() {
    afterEach(function() {
      parser.parsedOptions = {};
    });

    it('should parse the options when parse is called with valid values', function() {
      var mockObject = { foo: 2, bar: {baz: 'baa'} };
      processArgv([
          '--append-number', '24', 
          '-a', '1', '4', 
          '-o', JSON.stringify(mockObject)
      ]);
      parser.parse();
      parser.parsedOptions.should.be.an.Object.and.not.be.empty;
      
      parser.parsedOptions.should.have.property('appendNumber')
        .with.property('value').and.is.equal(24);
      parser.parsedOptions.appendNumber.should.equal(parser.options.appendNumber);

      parser.parsedOptions.should.have.property('a')
        .with.property('value').and.is.eql(['1','4']);
      parser.parsedOptions.a.should.equal(parser.options.a);

      parser.parsedOptions.should.have.property('o')
        .with.property('value').and.is.eql(mockObject);
      parser.parsedOptions.o.should.equal(parser.options.o);
    });


    describe('collectFlags', function() {
      it('should have no parsed options before parse is called', function() {
        parser.parsedOptions.should.be.an.Object.and.be.empty;
      });

      it('should parse nothing if no flags are given', function() {
        processArgv([]);
        parser.parse();
        parser.parsedOptions.should.be.an.Object.and.be.empty;
      });
    });


    describe('checkRequiredFlags', function() {
      it('should throw an error if a required flag is not set', function() {
        (function() {
          processArgv([]);
          new yumparse.Parser({
            options: [
              { shortFlag: '-i', type: Boolean, description: 'Input', required: true }
            ]
          }).parse();
        }).should.throw(/Required flags .* were not given/);
      });
    });


    describe('typeCheck', function() {
      it('should fail if an unrecognized flag is given', function() {
        processArgv(['--foo']);
        (function() {
          parser.parse()
        }).should.throw(/not a valid option/);
      });

      it('should fail if a value is given for a flag that expects a boolean', function() {
        processArgv(['-b', '12']);
        (function() {
          parser.parse()
        }).should.throw(/not a boolean value/);
      });

      it('should fail if a string is given for a flag that expects a number', function() {
        processArgv(['-n', 'foo']);
        (function() {
          parser.parse()
        }).should.throw(/not a number/);
      });

      it('should fail if an array is given for a flag that expects a string', function() {
        processArgv(['-s', 'baz', 'bar']);
        (function() {
          parser.parse()
        }).should.throw(/not a string/);
      });

      it('should fail if a JSON object is not passed as a string', function() {
        processArgv(['-o', '{foo:', '"bar"}']);
        (function() {
          parser.parse()
        }).should.throw(/JSON needs to be passed as a string/);
      }); 

      it('should fail if a JSON object is improperly formatted', function() {
        processArgv(['-o', '{foo: bar}']);
        (function() {
          parser.parse()
        }).should.throw(/Not a JSON object/);
      });
    });


    describe('checkRules', function() {
      it('should populate the rules array when adding a rule', function() {
        parser.rules.should.be.an.Array.and.be.empty;
        parser.addRule(yumparse.rules.orFlags('-s', '-n'));
        parser.rules.should.be.an.Array.and.not.be.empty.and.is.lengthOf(1);
      });

      it('should check the rules and throw an error if a rule fails', function() {
        processArgv(['-s', 'foo', '-n', '24']);
        (function() {
          parser.parse()
        }).should.throw(/You can only pass .* as a parameter/);
      });

      it('should continue if the rule succeeds', function() {
        processArgv(['-s', 'foo', '-a', 'bar']);
        parser.rules.should.be.an.Array.and.not.be.empty.and.have.lengthOf(1);
        parser.parse();
      });

      it('should accept rules with no message property', function() {
        processArgv(['-s', 'foo', '-n', '12']);
        parser.rules = [];
        var rule = { check: yumparse.rules.orFlags('-s', '-n').check };
        parser.addRule(rule);
        (function() {
          parser.parse()
        }).should.throw(/Invalid options/);
      });

      it('should accept multiple rules', function() {
        before(function() {
          parser.rules = [];
          parser.addRule(yumparse.rules.orFlags('-s', '-n'));
          parser.addRule(yumparse.rules.andFlags('-n', '-a'));
          parser.rules.should.be.an.Array.and.have.lengthOf(2);
        });

        it('should succeed if both rules are successfully applied', function() {
          processArgv(['-n', '12', '-a', '2', '6']);
          parser.parse();
          parser.parsedOptions.should.be.an.Object.and.not.be.empty;
          parser.parsedOptions.should.have.property('n').and.is.equalTo(12);
          parser.parsedOptions.should.have.property('a').and.is.equalTo([2,6]);
        });

        it('should fail if the orFlags rule is violated', function() {
          (function() {
            processArgv(['-s', 'foo', '-n', '12', '-a', '2', '6']);
            parser.parse();
          }).should.throw(/You can only pass .* as a parameter/);
        });

        it('should fail if the andFlags rule is violated', function() {
          (function() {
            processArgv(['-n', '12']);
            parser.parse();
          }).should.throw(/You must pass parameters .* together/);
        });
      });
    });
  });
});
