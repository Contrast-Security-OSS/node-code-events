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
      "node_modules/nan"
    ],
    "defines": [
      "NAPI_DISABLE_CPP_EXCEPTIONS"
    ],
    "xcode_settings": {
      "MACOSX_DEPLOYMENT_TARGET": "10.10",
      "OTHER_CFLAGS": [
        "-std=c++17",
        "-stdlib=libc++",
        "-Wall"
      ]
    },
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
      ["OS == 'win'", {
        "cflags": []
      }]
    ]
  }]
}
