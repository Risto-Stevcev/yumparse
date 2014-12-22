/**
 * @module yumparse
 * @author Risto Stevcev
 */
var mustache = require('mustache');


/**
 * Creates a yumparse Parser
 * @class
 * @param {Object} args - Arguments to pass into the parser
 * @param {String} [args.template] - The template that should be used for help/usage
 * @param {Object[]} args.options - The options that should be parsed
 * @param {String} args.options.shortFlag - The short flag for that option
 * @param {String} [args.options.longFlag] - The long flag for that option
 * @param {*} [args.options.type=String] - The type for that option
 * @param {Boolean} [args.options.required=false] - Set it to make it a required option
 * @param {String} args.options.description - The description of the option
 * @param {*} [args.options.defaultValue] - The default value for the option
 */
exports.Parser = function(args) {
  'use strict';

  /**
   * Creates a YumparseError
   * @class
   * @param {String} message - The error message
   */
  function YumparseError(message) {
    this.name = 'YumparseError';
    this.message = message || '';

    if (args && args.debug === true) {
      var error = new Error(message);
      error.name = this.name;
      this.stack = error.stack;
    }
  }
  YumparseError.prototype = Object.create(Error.prototype);

  /** 
   * Underline text (xterm color)
   * @type {String}
   * @private
   */
  var _U = '\u001b[4m';

  /**
   * Bold text (xterm color)
   * @type {String}
   * @private
   */
  var _B = '\u001b[1m';

  /**
   * Normal text (xterm color, ends bold text)
   * @type {String}
   * @private
   */
  var B_ = '\u001b[21m';

  /**
   * Normal text (xterm color, ends underlined text)
   * @type {String}
   * @private
   */
  var U_ = '\u001b[24m';

  /**
   * The default template
   * @type {String}
   * @instance
   */
  this.template = '' +
    '{{#program.description}}' +
    _B+'{{{program.name}}}'+B_ + ' - {{{program.description}}}\n' +
    '{{/program.description}}' +
    '\n\n' +

    _U+'Usage'+U_+'\n' +
    '  {{{program.name}}} [options]\n\n' +

    _U+'Options'+U_+'\n' +
    '{{#optionsList}}' +
    '  {{{flagBlock}}}    {{{description}}}\n' +
    '{{/optionsList}}' +

    '{{#example}}' +
    '\n\n' +
    _U+'Example'+U_+'\n' +
    '  {{{example}}}\n' +
    '{{/example}}';

  if (!args || !args.options) {
    throw new YumparseError('At least one flag needs to be given to the Parser');
  }

  if (args.program) {
    this.program = args.program;
  }
  else {
    this.program = { name: process.argv[1] };
  }

  if (args.example) {
    this.example = args.example;
  }

  if (args.template) {
    this.template = args.template;
  }

  if (!(args.options instanceof Array)) {
    throw new YumparseError('Options must be passed in as an array');
  }

  /**
   * The original options list that was passed in
   * @type {Array}
   * @instance
   */
  this.optionsList = args.options;


  /** 
   * The list of options that have a required set to true
   * @type {Array}
   * @instance
   */
  this.requiredList = [];
  
  /** 
   * The longest flag length
   * @type {Number}
   */
  var longestFlag = this.optionsList.reduce(function(previous, current) {
    return current.longFlag && current.longFlag.length > previous ? 
           current.longFlag.length : previous;
  }, 0);

  /** 
   * A mustache js helper function that returns a flag block
   * @returns {String} A flag block string
   * @this module:yumparse.Parser~parseOptions
   */
  this.flagBlock = function() {
    return (this.longFlag ?
            
            (new Array(longestFlag - this.longFlag.length + 1)).join(' ') + 
            this.longFlag + ', ' :

            (new Array(longestFlag + 1)).join(' ') + '  ') +
            this.shortFlag;
  };

  /** 
   * Available flag options 
   * @readonly
   * @enum {Object}
   */
  this.flagTypeOptions = [Boolean, Number, String, Array, Object];

  /** 
   * Convert a flag (spinal case) to a variable name (camel case)
   * @param {String} flag - The flag to convert
   * @returns {String} The variable name
   */
  this.flagToName = function(flag) {
    if (flag.match(/^--[-a-z]*$/)) {
      flag = flag.replace(/^--/, '');
      var idx = flag.search(/-[a-z]/);
      for (idx; idx > -1; idx = flag.search(/-[a-z]/)) {
        flag = flag.slice(0, idx) + 
               flag[idx + 1].toUpperCase() + 
               flag.slice(idx + 2, flag.length);
      }
      return flag;
    }
    else if (flag.match(/^-[a-z]$/)) {
      return flag[1];
    }
  };

  /**
   * Convert a variable name (camel case) to a flag (spinal case)
   * @param {String} name - The name to convert
   * @returns {String} The flag
   */
  this.nameToFlag = function(name) {
    if (name.length === 1 && name.match(/[a-z]/)) {
      return '-' + name;
    }
    else if (name.length > 1 && name.match(/[A-Za-z]/)) {
      var idx = name.search(/[A-Z]/);
      for (idx; idx > -1; idx = name.search(/[A-Z]/)) {
        name = name.slice(0, idx) + 
               '-' + name[idx].toLowerCase() + 
               name.slice(idx + 1, name.length);
      }
      return '--' + name;
    }
  };

  /**
   * Returns an object with parsed (String flag, JSON option) pairs
   * @type {Object}
   */
  this.parsedOptions = {};

  /**
   * Parse options
   * @param {Object} options - The options to parse
   * @return {Object} The parsed options
   */
  var parseOptions = function(options) {
    var flags = {};
    options.forEach(function(option) {
      if (!option.shortFlag || !option.type || !option.description) {
        throw new YumparseError('Parser object requires a flag that has at least ' + 
                        'shortFlag, type, and description attributes set');
      }

      if (!this.flagTypeOptions.some(function(type) {
                                       return type === option.type;
                                     })) {
        throw new YumparseError('The type given is not one of the valid types: ' +
                        this.flagTypeOptions.map(function(type) { 
                          return type.name; 
                        }).join(', '));
      }

      if (!option.shortFlag.match(/^-[a-z]/)) {
        throw new YumparseError('Short flag "' + option.shortFlag + 
                        '" must match the format: -[a-z]');
      }
      option.shortFlagName = this.flagToName(option.shortFlag);
      flags[option.shortFlagName] = option;

      if (option.longFlag) {
        if (!option.longFlag.match(/^--[-a-z]/)) {
          throw new YumparseError('Long flag "' + option.longFlag +
                          '" must match the format --[-a-z]*');
        }
        option.longFlagName = this.flagToName(option.longFlag); 
        flags[option.longFlagName] = option;
      }

      if (option.required) {
        this.requiredList.push(option);
      }

      if (option.defaultValue) {
        option.value = option.defaultValue;
        this.parsedOptions[option.shortFlagName] = option;

        if (option.longFlagName) {
          this.parsedOptions[option.longFlagName] = option;
        }
      }
    }, this);
    return flags;
  };

  /**
   * An object with (String flagName, JSON option) pairs 
   * @type {Object}
   */
  this.options = parseOptions.call(this, args.options);

  this.options.help = this.options.h = {
    shortFlag: '-h',
    longFlag: '--help',
    type: Boolean,
    description: 'Help message'
  };

  /** 
   * Contains the list of rules to be checked after parsing
   * @type {Array}
   */
  this.rules = [];

  /**
   * Adds a rule to check as part of the parsing
   * @param {Object} rule - The rule object
   * @param {Function} [rule.message] - A function that returns an error message if the rule fails
   * @param {Function} rule.check - The rule-check function to run. Returns true on success and false on failure.
   */
  this.addRule = function(rule) {
    this.rules.push(function() {
      if (!rule.check.call(this)) { 
        throw new YumparseError(rule.message ? rule.message.call(this) : 'Invalid options');
      }
    });
  };

  /** 
   * Help string
   * @returns {String} The help string
   */
  this.helpString = function() {
    return mustache.render(this.template, this);
  };

  /** Display help and exit the program */
  this.displayHelp = function() {
    console.log(this.helpString());
    process.exit();
  };

  /**
   * @description Parses the process.argv arguments and runs the checks for the rules
   * @returns Sets this.parsedOptions to the parsed options after all rules pass 
   */
  this.parse = function() {
    /** 
     * Adds a parsed option (see: {@link module:yumparse.Parser#parse})
     * @inner
     * @private
     * @memberof module:yumparse.Parser
     * @this module:yumparse.Parser 
     */
    var addParsedOption = function(flag, flagValue) {
      this.parsedOptions[flag] = this.options[flag];

      (function setParsedOptionsValue() {
        if (flagValue === undefined && this.options[flag].defaultValue) {
          this.parsedOptions[flag].value = this.options[flag].defaultValue;
        }
        else {
          this.parsedOptions[flag].value = flagValue;
        }
      }).call(this);
    };

    /**
     * Collects the flags and thier values from process.argv and adds them to parsedOptions (see {@link module:yumparse.Parser#parse})
     * @name collectFlags
     * @function
     * @inner
     * @private
     * @memberof module:yumparse.Parser
     * @this module:yumparse.Parser 
     */
    (function collectFlags() {
      var flag, flagValue;
      var args = process.argv.slice(2);
      args.forEach(function(arg) {
        var isFlag = arg.match(/^-[a-z]$/) || arg.match(/^--[-a-z]*$/);
        if (isFlag) {
          var flagName = this.flagToName(arg);
          if (!this.options[flagName]) {
            throw new YumparseError(arg + ' is not a valid option');
          }

          if (flag) {
            addParsedOption.call(this, flag, flagValue);
          }

          flag = flagName;
          flagValue = undefined;
        }
        else {
          if (flagValue && !(flagValue instanceof Array)) {
            flagValue = [flagValue];
          }
          if (flagValue && flagValue instanceof Array) {
            flagValue.push(arg);
          }
          else {
            flagValue = arg;
          }
        }
      }, this);

      if (flag) {
        addParsedOption.call(this, flag, flagValue);
      }
    }).call(this);

    /**
     * Check if required flags are passed (see {@link module:yumparse.Parser#parse})
     * @name checkRequiredFlags
     * @function
     * @inner
     * @private
     * @memberof module:yumparse.Parser
     * @this module:yumparse.Parser
     */
    (function checkRequiredFlags() {
      var notParsed = [];
      var requiredIsParsed = true;

      this.requiredList.forEach(function(requiredFlag) {
        var isParsed = this.parsedOptions[requiredFlag.shortFlagName] !== undefined ||
                       this.parsedOptions[requiredFlag.longFlagName] !== undefined;

        if (!isParsed) {
          notParsed.push(requiredFlag.shortFlag +
                         (requiredFlag.longFlag ? ' | ' + requiredFlag.longFlag : ''));
        }

        requiredIsParsed = requiredIsParsed && isParsed;
      }, this);

      if (!requiredIsParsed) {
        throw new YumparseError('Required flags ' + JSON.stringify(notParsed) + 
                                ' were not given');
      }
    }).call(this);

    /**
     * Typecheck the parsed options 
     * @name typeCheck 
     * @function
     * @inner
     * @private
     * @memberof module:yumparse.Parser
     * @this module:yumparse.Parser 
     */
    (function typeCheck() {
      Object.keys(this.parsedOptions).forEach(function(flag) {
        var option = this.parsedOptions[flag];
        
        switch (option.type) {
          case Boolean:
            if (option.value === undefined) {
              option.value = true;
            }
            else if (typeof JSON.parse(option.value) === 'boolean') {
              option.value = JSON.parse(option.value);
            }
            else {
              throw new YumparseError(option.value + ' is not a boolean value');
            }
            break;
          case Number:
            if (!isNaN(option.value)) {
              option.value = parseInt(option.value);
            }
            else {
              throw new YumparseError(option.value + ' is not a number');
            }
            break;
          case Array:
            if (!option.value) {
              throw new YumparseError('A value was not given for flag "' + option.shortFlag + '"');
            }
            break;
          case String:
            if (typeof option.value !== 'string') {
              throw new YumparseError(JSON.stringify(option.value) + ' is not a string');
            }
            break;
          case Object:
            if (!option.value) {
              throw new YumparseError('A value was not given for flag "' + option.shortFlag + '"');
            }
            if (typeof option.value !== 'string') {
              throw new YumparseError('JSON needs to be passed as a string');
            }

            try {
              option.value = JSON.parse(option.value);
            }
            catch (e) {
              throw new YumparseError('Not a JSON object');
            }
            break;
          default:
            throw new YumparseError('Type ' + option.type + ' is not a valid type'); 
            break;
        }
      }, this);
    }).call(this);

    /**
     * Display parsed help 
     * @name displayParsedHelp
     * @function
     * @inner
     * @private
     * @memberof module:yumparse.Parser
     * @this module:yumparse.Parser 
     */
    (function displayParsedHelp() {
      if (this.parsedOptions.h || this.parsedOptions.help) {
        this.displayHelp();
      }
    }).call(this);

    /**
     * Check rules 
     * @name checkRules 
     * @function
     * @inner
     * @private
     * @memberof module:yumparse.Parser
     * @this module:yumparse.Parser 
     */
    (function checkRules() {
      this.rules.forEach(function(rule) {
        rule.call(this);
      }, this);
    }).call(this);
  };
};


/**
 * Helper functions
 * @property {Function} helpers.argsToOptions - Returns an options list from an flags list
 * @property {Function} helpers.allFlagsPassed - Check if all flags are passed
 * @property {Function} helpers.oneFlagPassed - Check if exactly one flag is passed
 */
exports.helpers = {
  argsToOptions: function(args, delimiter) {
    if (!delimiter) {
      delimiter = ' or ';
    }

    return args.map(function(arg) {
             return this.options[this.flagToName(arg)];
           }, this)
           .reduce(function(previous, current) {
             return (previous ? previous + delimiter : '') + 
                    (current ? '['+ current.shortFlag +' | '+ current.longFlag +']' : '');
           }, '');
  },

  allFlagsPassed: function(flags) {
    return flags.every(function(flag) {
      var option = this.options[this.flagToName(flag)];
      if (!option) {
        return false;
      }
      else {
        return this.parsedOptions[option.shortFlagName] ||
               this.parsedOptions[option.longFlagName];
      }
    }, this);
  },

  oneFlagPassed: function(flags) {
    var numFlagsPassed = 0;

    flags.forEach(function(flag) {
      var option = this.options[this.flagToName(flag)];
      if (option) {
        if (this.parsedOptions[option.shortFlagName] !== undefined ||
            this.parsedOptions[option.longFlagName]  !== undefined) {
          numFlagsPassed += 1;
        }
      }
    }, this);

    return numFlagsPassed === 1;
  }
};

/** 
 * An object containing built-in rule factory functions 
 * @property {Object} rules.orFlags - Returns an (OR) rule that compares 2+ options that must be passed separately 
 * @property {Object} rules.andFlags - Returns an (AND) rule that compares 2+ options that must be passed together
 */
exports.rules = {
  requiredOrFlags: function() {
    'use strict';
    var args = Array.prototype.slice.call(arguments);
    return {
      message: function() {
        return 'You must pass either ' + exports.helpers.argsToOptions.call(this, args) + 
               ' as a parameter.';
      },
      check: function() { 
        return exports.helpers.oneFlagPassed.call(this, args);
      }
    };
  },

  orFlags: function() {
    'use strict';
    var args = Array.prototype.slice.call(arguments);
    return {
      message: function() {
        return 'You can only pass ' + exports.helpers.argsToOptions.call(this, args) + 
               ' as a parameter.';
      },
      check: function() { 
        return !exports.helpers.allFlagsPassed.call(this, args);
      }
    };
  },

  andFlags: function() {
    'use strict';
    var args = Array.prototype.slice.call(arguments);
    return {
      message: function() {
        return 'You must pass parameters ' + JSON.stringify(args) + ' together.';
      },
      check: function() { 
        return exports.helpers.allFlagsPassed.call(this, args);
      }
    };
  }
};


/* 
 * TODO: exports.rules.checkFile - Checks if the type is a file (path)
 * options - Can be infinite, and it should check each option value of each to see if:
 * The file exists
 * The file matches the required extension
 */
