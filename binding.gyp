{
  "variables" : {
    "openssl_fips": ""
  },
  "targets": [{
    "target_name": "code_events",
    "sources": [
      "src/main.cpp"
    ],
    "include_dirs": [
      "src",
      "<!@(node -p \"require('node-addon-api').include\")",
      "<!(node -e \"require('nan')\")"
    ],
    "defines": [
      "NAPI_DISABLE_CPP_EXCEPTIONS"
    ],
    "conditions": [
      ["OS == 'linux'", {
        "cflags": [
          "-std=c++11",
          "-Wall"
        ],
        "cflags_cc": [
          "-Wno-cast-function-type"
        ]
      }],
      ["OS == 'mac'", {
        "xcode_settings": {
          "MACOSX_DEPLOYMENT_TARGET": "10.10",
          "OTHER_CFLAGS": [
            "-arch x86_64",
            "-arch arm64",
            "-std=c++17",
            "-stdlib=libc++",
            "-Wall"
          ],
          "OTHER_LDFLAGS": [
            "-arch x86_64",
            "-arch arm64"
          ]
        }
      }],
      ["OS == 'win'", {
        "cflags": []
      }]
    ]
  }]
}
