# Ecoflow MQTT to SvitloBot

[![Docker Image Version](https://img.shields.io/docker/v/petrovoronov/ecoflow-mqtt-to-svitlobot)](https://hub.docker.com/r/petrovoronov/ecoflow-mqtt-to-svitlobot)
[![Docker Pulls](https://img.shields.io/docker/pulls/petrovoronov/ecoflow-mqtt-to-svitlobot)](https://hub.docker.com/r/petrovoronov/ecoflow-mqtt-to-svitlobot)
[![GitHub license](https://img.shields.io/github/license/PetroVoronov/ecoflow-mqtt-to-svitlobot)](LICENSE)
[![GitHub last commit](https://img.shields.io/github/last-commit/PetroVoronov/ecoflow-mqtt-to-svitlobot)](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/commits/main)
[![GitHub issues](https://img.shields.io/github/issues/PetroVoronov/ecoflow-mqtt-to-svitlobot)](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/PetroVoronov/ecoflow-mqtt-to-svitlobot)](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/pulls)

[![Ukrainian translation](https://img.shields.io/static/v1?label=Readme&message=Ukrainian&labelColor=1f5fb2&color=fad247)](README-uk.md)

## About

This project integrates Ecoflow MQTT broker with SvitloBot API and report the presence or absence of AC input on Ecoflow device.

## Features

- Connects to Ecoflow MQTT broker;
- Subscribes to MQTT topics to monitor AC input parameters;
- "Ping" svitlobot API in case of AC input presence.

## Prerequisites

- Ecoflow device: Tested with Ecoflow DELTA Pro. Should work with other Ecoflow devices that support MQTT. (Please refer on [EcoFlow to Prometheus exporter](https://github.com/berezhinskiy/ecoflow_exporter)).
- Node.js or Docker installed.
- Ecoflow device (serial number) and developer credentials from [EcoFlow Developer Platform](https://developer.ecoflow.com/).
- Registered [SvitloBot](https://svitlobot.in.ua/) Channel and Channel Key.


## Installation

### Docker image installation

```sh
docker pull petrovoronov/ecoflow-mqtt-to-svitlobot
```

### Node.js installation from the source code

   1. Clone the repository:
        ```sh
        git clone https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot.git
        cd ecoflow-mqtt-to-svitlobot
        ```

   2. Install dependencies:
        ```sh
        npm install
        ```

## Passing the basic configuration parameters
Basic configuration parameters, including Ecoflow and SvitloBot credentials can be passed as environment variables:

```sh
export ECOFLOW_USERNAME=your_ecoflow_username
export ECOFLOW_PASSWORD=your_ecoflow_password
export ECOFLOW_DEVICE_SN=your_ecoflow_device_sn
export SVITLOBOT_CHANNEL_KEY=your_svitlobot_channel_key
```

or you can skip it and application will ask you to enter it interactively.

After first run these parameters will be stored in the `config` directory and will be used for the next runs.
So you will be asked to enter the parameters only once (or you should pass it as environment variables only on the first run).

**Important notice: if you want to change the parameters you should pass it again as environment variables at any time.**

## Command-line Options

The application can be configured using the following command-line options:

| Option                          | Alias | Description                                                                                     | Type    | Default | Required |
|---------------------------------|-------|-------------------------------------------------------------------------------------------------|---------|---------|----------|
| `--errors-count-max`            | `-e`  | Maximum number of errors count for the SvitloBot ping                                           | Number  | `5`     | No       |
| `--svitlobot-update-interval`   | `-i`  | Update status of the svitlobot every X seconds                                                  | Number  | `60`    | No       |
| `--keep-alive`                  | `-k`  | Check if the MQTT client is alive every Y update intervals                                      | Number  | `3`     | No       |
| `--log-ping`                    |       | Log the "ping" status of the SvitloBot API                                                      | Boolean |         | No       |
| `--log-alive-status-interval`   | `-l`  | Log the MQTT client alive status every Z minutes                                                | Number  | `0`     | No       |
| `--debug`                       | `-d`  | Debug level of logging                                                                          | Boolean |         | No       |

## Running the Application

### Node.js

There is an example with all possible command-line options:

```sh
node src/index.js -i 60 -k 3 -l 60 -d true
```

### Docker

By default the application will run without any additional command-line options.

Due to the limitations of the Docker environment, the application will not be able to ask for the missing configuration parameters interactively. That's why you need to make a first run in interactive mode to provide the missing parameters.

#### Docker Volumes

**You must to map the application data directory to the container:**
- `/app/config` - for the application configurations. Mandatory for the mapping!
You can map in on any local directory on the host system or docker volume.

#### Docker first run

So, the first run should be like one of the following:
- to set all basic configuration parameters interactively:
    ```sh
    docker run -it --name ecoflow-mqtt-to-svitlobot \
        -v /path/to/your/config:/app/config \
        petrovoronov/ecoflow-mqtt-to-svitlobot:latest
    ```

- to set all basic configuration parameters as environment variables:
    ```sh
    docker run -d --name ecoflow-mqtt-to-svitlobot \
        -v /path/to/your/config:/app/config \
        -e ECOFLOW_USERNAME=your_ecoflow_username \
        -e ECOFLOW_PASSWORD=your_ecoflow_password \
        -e ECOFLOW_DEVICE_SN=your_ecoflow_device_sn \
        -e SVITLOBOT_CHANNEL_KEY=your_svitlobot_channel_key \
        petrovoronov/ecoflow-mqtt-to-svitlobot:latest
    ```

**Important notice: pass all later needed command-line options at first run!***

After the first run the application will store the configuration parameters and additional info - please stop the container by pressing `Ctrl+C` and start it again with the commands from the next section.

#### Docker next runs

After the first run you can run the application with the same configuration parameters as the previous run without any additional command-line options.

To start the application, run the following command:

```sh
docker start ecoflow-mqtt-to-svitlobot
```

To stop the application, run the following command:

```sh
docker stop ecoflow-mqtt-to-svitlobot
```

### Docker Compose

To run the application using Docker Compose, create a `docker-compose.yml` file with the following content:

```yaml
version: '3'
services:
    ecoflow-mqtt-to-svitlobot:
        image: petrovoronov/ecoflow-mqtt-to-svitlobot:latest
        volumes:
            - /path/to/your/config:/app/config
        environment:
            - ECOFLOW_USERNAME=your_ecoflow_username
            - ECOFLOW_PASSWORD=your_ecoflow_password
            - ECOFLOW_DEVICE_SN=your_ecoflow_device_sn
            - SVITLOBOT_CHANNEL_KEY=your_svitlobot_channel_key
        command: node src/index.js -i 60 -k 3 -l 60
```

Replace `/path/to/your/config` with the actual paths on your system where you want to store the application config.

Then, run the following command to start the application:

```sh
docker-compose up -d
```

This will start the application with the specified configuration parameters.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.