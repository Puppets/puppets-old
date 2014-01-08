module.exports = function( grunt ) {

  var fileList = [
    'src/puppets.application.js',
    'src/puppets.region.js',
    'src/puppets.item-view.js',
    'src/puppets.puppet.js',
    'src/puppets.events.js',
    'src/puppets.stateful.js'
  ];

  grunt.initConfig({

    clean: {
      main: {
        src: [ 'build' ]
      }
    },

    uglify: {
      main: {
        src: fileList,
        dest: 'build/puppets.min.js'
      }
    },

    concat: {
      main: {
        src: fileList,
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