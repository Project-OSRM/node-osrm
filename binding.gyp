{
  'includes': [ 'common.gypi' ],
  'variables': {
      'osrm%':'../Project-OSRM/',
  },
  'targets': [
    {
      'target_name': '_osrm',
      'include_dirs': [
          '<@(osrm)/Library/',
          './src/'
      ],
      'cflags_cc!': ['-fno-rtti', '-fno-exceptions'],
      'cflags_cc' : [ ],
      'libraries': [
        '-L../<@(osrm)/build',
        '-lOSRM',
      ],
      'sources': [
        "src/node_osrm.cpp",
        "<@(osrm)/Util/GitDescription.cpp"
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
