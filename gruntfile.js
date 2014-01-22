module.exports = function( grunt ) {

  var fileList = [
    'bower_components/backbone.wreqr-channel/backbone.wreqr-channel.js',
    'src/machina.base.js',
    'src/puppets.region.js',
    'src/puppets.item-view.js',
    'src/puppets.puppet.js'
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