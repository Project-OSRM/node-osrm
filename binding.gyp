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
        '<@(cwd)/../Project-OSRM/build/libUUID.a',
        '<@(cwd)/../Project-OSRM/build/libGITDESCRIPTION.a'
      ],
      'conditions': [ [ 'OS=="linux"', {
            'libraries+':[
                '-Wl,-rpath=<@(cwd)/../Project-OSRM/build',
                '-lboost_program_options',
                '-lboost_regex',
            ]}
      ] ],
      'sources': [
        "src/node_osrm.cpp"
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
