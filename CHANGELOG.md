# Changelog

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
