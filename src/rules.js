/**
 * @module rules
 * @author Risto Stevcev
 */
var helpers = require('./helpers.js');

/** 
 * An object containing built-in rule factory functions 
 * @memberof module:rules 
 * @property {Object} rules.requiredOrFlags - A rule that compares options that must be passed separately and at least one flag is passed
 * @property {Object} rules.orFlags - A rule that compares options that must be passed separately 
 * @property {Object} rules.andFlagSets - A rule that checks if a single flag in each set of flags is passed
 * @property {Object} rules.andFlags - A rule that compares options that must be passed together
 * @property {Object} rules.fileExists - A rule that checks options to see if the file path exists 
 */
module.exports = {
  requiredOrFlags: function() {
    'use strict';
    var args = Array.prototype.slice.call(arguments);
    return {
      message: function() {
        return 'You must pass either ' + helpers.argsToOptions.call(this, args) + 
               ' as a parameter.';
      },
      check: function() { 
        return helpers.oneFlagPassed.call(this, args);
      }
    };
  },

  orFlags: function() {
    'use strict';
    var args = Array.prototype.slice.call(arguments);
    return {
      message: function() {
        return 'You can only pass ' + helpers.argsToOptions.call(this, args) + 
               ' as a parameter.';
      },
      check: function() { 
        return Object.keys(this.parsedOptions).length ? 
               helpers.oneFlagPassed.call(this, args) : true;
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
        return helpers.allFlagsPassed.call(this, args);
      }
    };
  },

  andFlagSets: function() {
    'use strict';
    var args = Array.prototype.slice.call(arguments);
    return {
      message: function() {
        return 'A flag must be passed from each set: ' + JSON.stringify(args);
      },
      check: function() { 
        return helpers.allFlagSetsPassed.call(this, args);
      }
    };
  },

  fileExists: function() {
    'use strict';
    var args = Array.prototype.slice.call(arguments);
    return {
      message: function() {
        return 'One of the following file paths ' + JSON.stringify(args) + ' does not exist.';
      },
      check: function() { 
        return helpers.fileExists.call(this, args);
      }
    };
  }
};
