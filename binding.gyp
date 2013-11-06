{
  'includes': [ 'common.gypi' ],
  'variables': {
      'cwd%':'<!(pwd)',
  },
  'targets': [
    {
      'target_name': '_osrm',
      'include_dirs': [
          '<@(cwd)/../Project-OSRM/Library/',
          './src/'
      ],
      'cflags_cc!': ['-fno-rtti', '-fno-exceptions'],
      'cflags_cc' : [ ],
      'libraries': [
        '-L<@(cwd)/../Project-OSRM/build',
        '-lOSRM',
      ],
      'conditions': [ [ 'OS=="linux"', {'libraries+':['-Wl,-rpath=<@(cwd)/../Project-OSRM/build']} ] ],
      'sources': [
        "src/node_osrm.cpp",
        "../Project-OSRM/Util/GitDescription.cpp"
      ],
      'xcode_settings': {
        'OTHER_CPLUSPLUSFLAGS':['-Wno-unneeded-internal-declaration', '-Wno-unknown-pragmas'],
        'GCC_ENABLE_CPP_RTTI': 'YES',
        'GCC_ENABLE_CPP_EXCEPTIONS': 'YES'
      }
    },
    {
      'target_name': 'action_after_build',
      'type': 'none',
      'dependencies': [ '_osrm' ],
      'copies': [
          {
            'files': [ '<(PRODUCT_DIR)/_osrm.node' ],
            'destination': './lib/'
          }
      ]
    }
  ]
}
