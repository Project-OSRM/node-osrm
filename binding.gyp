{
  'includes': [ 'common.gypi' ],
  'variables': {
      'std%':'ansi',
      'runtime_link%':'static',
      "module_name":"<!(node -e \"console.log(require('./package.json').binary.module_name)\")",
      "module_path":"<!(node -e \"console.log(require('./package.json').binary.module_path)\")",
  },
  'targets': [
    {
      'target_name': '<(module_name)',
      'include_dirs': [
          "<!(node -e \"require('nan')\")",
          '<!@(pkg-config libosrm --cflags)',
          './src/'
      ],
      'libraries': [
        '<!@(pkg-config libosrm --libs)'
      ],
      'conditions': [
        [ 'OS=="linux"', {
          'cflags_cc' : [
              '-std=c++11',
          ],
          'libraries':[
              '-Wl,-rpath=<!@(pkg-config libosrm --variable=prefix)/lib',
              '-lboost_program_options',
              '-lboost_regex'
          ]}
        ],
        ['runtime_link == "static"', {
            'libraries': [
                '<!@(pkg-config libosrm --libs --static)'
             ]
        }],
        ['OS=="mac"', {
          'xcode_settings': {
            'OTHER_CPLUSPLUSFLAGS':['-std=c++11','-stdlib=libc++'],
            'OTHER_CPLUSPLUSFLAGS':['-stdlib=libc++'],
            'OTHER_LDFLAGS':['-stdlib=libc++'],
            'CLANG_CXX_LANGUAGE_STANDARD':'c++11',
            'MACOSX_DEPLOYMENT_TARGET':'10.7'
          }
        }
        ]
      ],
      'sources': [
        "src/node_osrm.cpp"
      ],
      'cflags_cc!': ['-fno-rtti', '-fno-exceptions'],
      'xcode_settings': {
        'OTHER_CPLUSPLUSFLAGS':['-Wno-unneeded-internal-declaration', '-Wno-unknown-pragmas'],
        'GCC_ENABLE_CPP_RTTI': 'YES',
        'GCC_ENABLE_CPP_EXCEPTIONS': 'YES'
      }
    },
    {
      'target_name': 'action_after_build',
      'type': 'none',
      'dependencies': [ '<(module_name)' ],
      'copies': [
          {
            'files': [ '<(PRODUCT_DIR)/<(module_name).node' ],
            'destination': '<(module_path)'
          }
      ]
    }
  ]
}
