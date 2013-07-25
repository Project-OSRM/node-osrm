{
  'conditions': [
      ['OS=="win"', {
        'variables': {
          'copy_command%': 'copy',
          'bin_name':'call'
        },
      },{
        'variables': {
          'copy_command%': 'cp',
          'bin_name':'node'
        },
      }]
  ],
  'target_defaults': {
      'default_configuration': 'Release',
      'configurations': {
          'Debug': {
              'cflags_cc!': ['-O3', '-DNDEBUG'],
              'xcode_settings': {
                'OTHER_CPLUSPLUSFLAGS!':['-O3', '-DNDEBUG']
              },
              'msvs_settings': {
                 'VCCLCompilerTool': {
                     'ExceptionHandling': 1,
                     'RuntimeTypeInfo':'true',
                     'RuntimeLibrary': '3'
                 }
              }
          },
          'Release': {
          }
      },
      'include_dirs': [
          '../Library/',
          './src/'
      ],
      'cflags_cc!': ['-fno-rtti', '-fno-exceptions'],
      'cflags_cc' : [ ],
      'libraries': [
        '-L../../build/',
        '-lOSRM',
      ]
  },
  'targets': [
    {
      'target_name': '_osrm',
      'sources': [
        "src/node_osrm.cpp"
      ],
      'xcode_settings': {
        'OTHER_CPLUSPLUSFLAGS':[ ],
        'GCC_ENABLE_CPP_RTTI': 'YES',
        'GCC_ENABLE_CPP_EXCEPTIONS': 'YES'
      }
    },
    {
      'target_name': 'action_after_build',
      'type': 'none',
      'dependencies': [ '_osrm' ],
'actions': [
        {
          'action_name': 'move_node_module',
          'inputs': [
            '<@(PRODUCT_DIR)/_osrm.node'
          ],
          'outputs': [
            'lib/_osrm.node'
          ],
          'action': ['<@(copy_command)', '<@(PRODUCT_DIR)/_osrm.node', 'lib/_osrm.node']
        }
      ]
    }
  ]
}