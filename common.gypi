{
  'variables': {
      "is_mavericks":"<!(python -c \"import os;u=os.uname();print (u[0] == 'Darwin' and u[2][0:2] == '13')\")"
  },
  'target_defaults': {
      'default_configuration': 'Release',
      'conditions': [
        [ '"<(is_mavericks)"=="True"', {
            'xcode_settings': {
              'MACOSX_DEPLOYMENT_TARGET':'10.9'
            }
          }
        ]
      ],
      'configurations': {
          'Debug': {
              'defines!': [ 'NDEBUG' ],
              'cflags_cc!': ['-O3', '-Os', '-DNDEBUG'],
              'xcode_settings': {
                'OTHER_CPLUSPLUSFLAGS!':['-O3', '-Os', '-DDEBUG'],
                'GCC_OPTIMIZATION_LEVEL': '0',
                'GCC_GENERATE_DEBUGGING_SYMBOLS': 'YES'
              }
          },
          'Release': {
              'defines': [
                'NDEBUG'
              ],
              'xcode_settings': {
                'OTHER_CPLUSPLUSFLAGS!':['-Os', '-O2'],
                'GCC_OPTIMIZATION_LEVEL': '3',
                'GCC_GENERATE_DEBUGGING_SYMBOLS': 'NO',
                'DEAD_CODE_STRIPPING':'YES',
                'GCC_INLINES_ARE_PRIVATE_EXTERN':'YES'
              },
              'ldflags': [
                    '-Wl,-s'
              ]
          }
      }
  }
}