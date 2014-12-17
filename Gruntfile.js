module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-simple-mocha');
  grunt.loadNpmTasks('grunt-jsdoc');

  grunt.initConfig({
    clean: ['./doc/'],
    jshint: {
      options: {
        eqeqeq: true,
        eqnull: true,
        browser: true,
        quotmark: 'single',
        globals: {
          'nodejs': true
        },
      },
      ignore_warning: {
        /* Error messages url: 
         * https://github.com/jshint/jshint/blob/2.1.4/src/shared/messages.js */
        options: {
          '-W117': true,  // "'{a}' is not defined."
          '-W097': true,  // "Use the function form of \"use strict\"." 
          '-W064': true,  // "Missing 'new' prefix when invoking a constructor."
        },
        src: ['src/*.js']
      },
    },
    simplemocha: {
      options: {
        globals: ['should'],
        timeout: 3000,
        ignoreLeaks: false,
        ui: 'bdd'
      },

      all: {
        src: 'test/*.js'
      }
    },
    jsdoc : {
      dist : {
        src: ['src/*.js', 'test/*.js'], 
        options: {
          //explain: true,
          private: true,
          destination: 'doc/'
        }
      }
    }
  });

  grunt.registerTask('test', ['clean', 'jshint', 'simplemocha']);
  grunt.registerTask('default', ['test', 'jsdoc']);
};
