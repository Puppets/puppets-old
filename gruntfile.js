module.exports = function( grunt ) {

  grunt.initConfig({

    clean: {
      main: {
        src: [ 'build' ]
      }
    },

    uglify: {
      main: {
        src: 'src/*.js',
        dest: 'build/puppets.min.js'
      }
    },

    concat: {
      main: {
        src: [
          'src/*.js'
        ],
        dest: 'build/puppets.js'
      }
    }

  });

  var node_modules = [
    'grunt-contrib-uglify',
    'grunt-contrib-concat',
    'grunt-contrib-clean',
  ];

  node_modules.forEach(function(module) {
    grunt.loadNpmTasks(module);
  });

  // Register tasks
  grunt.registerTask( "default", [ 'clean', 'concat', 'uglify' ] );

};