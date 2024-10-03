# Changelog

## [1.1.0](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/compare/v1.0.9...v1.1.0) (2024-10-03)


### Features

* Added authentication via access and secret keys pair, as alternative to user and password ([a9404e0](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/commit/a9404e0360f518348704e8a9705f89617d9aa101))


### Code Refactoring

* **command-line:** Added `--api-url` - to change the address of EcoFlow API, -`-test-only` - to work without real ping of SvitloBot API, and some keys related to authentication ([a9404e0](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/commit/a9404e0360f518348704e8a9705f89617d9aa101))
* **docker:** The Dockerfile is updated to use "ENTRYPOINT" instead of "CMD" for running the application. **Please take it in account**, if you use docker and command-line parameters ([a9404e0](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/commit/a9404e0360f518348704e8a9705f89617d9aa101))


### Build System

* **deps-dev:** bump @babel/core from 7.25.2 to 7.25.7 ([a597eb2](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/commit/a597eb21b26efa078eefd97d84786640553d8ae1))
* **deps-dev:** bump @babel/eslint-parser from 7.25.1 to 7.25.7 ([fc90e87](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/commit/fc90e8716a0204dd668152f91e31aabed941d626))
* **deps-dev:** bump eslint-plugin-sonarjs from 2.0.2 to 2.0.3 ([172f2d3](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/commit/172f2d3a1b113aa6365d50ed8b00aeeeeb93d087))
* **deps-dev:** bump globals from 15.9.0 to 15.10.0 ([084a2c4](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/commit/084a2c4e7e38354e6d26cc30d863bf8f46a83c0b))


### Continuous Integration

* change orders of sections to generate CHANGELOG.md ([41e891e](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/commit/41e891ed002ce155c398e08cc4211003cd20987c))
* Update repo description in deploy_docker_on_tag.yml ([8badc4d](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/commit/8badc4d8970fdb235f1073f9e2ca66b8e77463bf))


### Documentation

* Small cosmetic fix ([0cf191f](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/commit/0cf191fd2dbca70d735e599f708fb34143464918))

## [1.0.9](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/compare/v1.0.8...v1.0.9) (2024-09-17)


### Documentation

* Append missed records to CHANGELOG.md ([996abaf](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/commit/996abaf1e274c4fa17ed81d79302c99b0005618d))
* Rearrange commits between "old" releases ([c534cf6](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/commit/c534cf66479e2637b331efbff37e688dc2ed3fab))
* Update CHANGELOG.md - cosmetic fixes ([9958e2c](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/commit/9958e2cb71bdb2db0394d3713f2dca8563687cd5))


### Bug Fixes

* Secured logger eliminate printing in log the sensitive information, including `DeviceSN`, `ClientId`, `ChannelKey` ([72309dd](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/commit/72309dd2fae69fda000810785f1b546667103f2a))


### Code Refactoring

* **cache:** New logger is applied ([72309dd](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/commit/72309dd2fae69fda000810785f1b546667103f2a))
* Now `logging.js` is refactored and  based on `logform`. ([72309dd](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/commit/72309dd2fae69fda000810785f1b546667103f2a))

## [1.0.8](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/compare/v1.0.7...v1.0.8) (2024-09-15)


### Code Refactoring

* Add version logging on start ([c536af8](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/commit/c536af87ec35113b0ebc2ccef9ea89eb376ee9e5))
* cache handling to handle null and undefined values ([9109a4c](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/commit/9109a4c9b46c25a2f24abd71eff1921e4c60c561))

## [1.0.7](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/compare/v1.0.6...v1.0.7) (2024-09-15)


### Continuous Integration

* refactor Dockerfile ([4a062c2](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/commit/4a062c2b5d525902f12b38c561c065b6c680106b))
* **release-please:** Make it possible to update `src/version.js` to actual version via `release-please-action` ([4a062c2](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/commit/4a062c2b5d525902f12b38c561c065b6c680106b))

## [1.0.6](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/compare/v1.0.5...v1.0.6) (2024-09-14)


### Continuous Integration

* Update release-please workflow configuration ([6e3dffa](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/commit/6e3dffafcbf6d9af56417c5b35336274ca52b731))

## [1.0.5](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/compare/v1.0.4...v1.0.5) (2024-09-14)


### Bug Fixes

* Update release-please workflow to use 'node' release type ([6c2bf35](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/commit/6c2bf35ba93153c0c84967b803f377a9771da026))

## [1.0.4](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/compare/v1.0.3...v1.0.4) (2024-09-14)


### Documentation

* Update release badges in README files ([1272c0c](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/commit/1272c0c7405175c34c6630a54495e4cbdfb30b24))

### Continuous Integration

* Update release-please workflow ([f9dbe99](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/commit/f9dbe9925a8818666f037a5f099f336325e30918))

## [1.0.3](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/compare/v1.0.2...v1.0.3) (2024-09-14)


### Continuous Integration

* Add release-please workflow ([0265c32](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/commit/0265c3212dd8729c7498c9255b9245d5f2830062))

## [1.0.2](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/compare/v1.0.1...v1.0.2) (2024-09-14)


### Code Refactoring

* Refactor code to the usage of async/await in most cases. Simple error handling for SvitloBot API is implemented. Additionally added new command-line option to log SvitloBot ping success results, without enabling the debug. ([04a4828](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/commit/04a48280dca66291e6f9be613f7496661809b137))

### Documentation

* Refactor README files to update project name and remove Telegram references ([bf13371](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/commit/bf1337164b79d46778c6bc3fabb380cde8c63833))


## 1.0.1 (2024-09-10)


### Features

* Initial code version 1.0.1 ([964e5e6](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/commit/964e5e6f9c8b75f42d9338ad02c37af23bb95cc5))

### Code Refactoring

* Refactor Dockerfile to optimize dependencies installation ([ada1ff2](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/commit/ada1ff2d85526c94702ea0a7016c4ea6ad85eec9))

## 1.0.0 (2024-09-10)


### Miscellaneous Chores

* Initial commit ([3f31e05](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/commit/3f31e05e8a66cdd5bf72fa39d18ec9d48d3a42e5))
