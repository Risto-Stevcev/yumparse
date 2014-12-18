module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks('grunt-mocha-istanbul');
  grunt.loadNpmTasks('grunt-codeclimate');


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
        },
        src: ['src/*.js']
      },
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
    },
    mocha_istanbul: {
      coverage: {
        src: 'test',
        options: {
          coverage: true,
          check: {
            lines: 75,
            statements: 75
          },
          root: './src',
          reportFormats: ['lcovonly']
        }
      },
    },
    codeclimate: {
      options: {
        file: 'coverage/lcov.info',
        token: '6c836b2900e44f248f582dfda2651fda13b331a13fe49bb8b29df10ed56efcd1'
      }
    }
  });

  grunt.event.on('coverage', function(lcov, done){
      done(); // or done(false); in case of error
  });


  grunt.registerTask('test', ['clean', 'jshint', 'mocha_istanbul']);
  grunt.registerTask('default', ['test', 'codeclimate', 'jsdoc']);
};
