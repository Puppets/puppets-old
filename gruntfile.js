module.exports = function( grunt ) {

  require('load-grunt-tasks')(grunt);

  var fileList = [
    'bower_components/backbone.wreqr-radio/build/backbone.wreqr-radio.js',
    'src/puppets.js'
  ];

  grunt.initConfig({

    clean: {
      main: {
        src: [ 'build' ]
      }
    },

    jshint: {
      main: {
        options: {
          jshintrc: '.jshintrc'
        },
        src: 'src/*.js'
      },
      tests: {
        options: {
          '-W030': true
        },
        src: 'tests/spec/*.js'
      }
    },

    concat: {
      main: {
        src: fileList,
        dest: 'build/puppets.js'
      }
    },

    uglify: {
      main: {
        src: fileList,
        dest: 'build/puppets.min.js'
      }
    },

    // Starts a server for running tests in the browser
    connect: {
      mocha: {
        options: {
          base: [ './', './src', 'tests' ],
          debug: true,
          open: true,
          keepalive: true
        }
      }
    },

    blanket_mocha : {    
      test: {
        src: ['tests/index.html'],                
        options: {    
          threshold: 70,
          globalThreshold: 70,
          log: true,
          logErrors: true
        }                
      }      
    }

  });

  // The default is just an alias of test
  grunt.registerTask( 'default', ['test'] );

  // Lints and runs unit tests
  grunt.registerTask( 'test', ['jshint', 'concat', 'blanket_mocha'] );

  // To run tests in the browser
  grunt.registerTask( 'browser-test', ['connect'] );

  // Build the script
  grunt.registerTask( 'build', ['default', 'clean', 'concat', 'uglify'] );

};