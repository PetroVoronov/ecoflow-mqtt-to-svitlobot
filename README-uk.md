# Ecoflow MQTT to SvitloBot

[![GitHub release](https://img.shields.io/github/v/release/PetroVoronov/ecoflow-mqtt-to-svitlobot)](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/releases)
[![Docker Image Version](https://img.shields.io/docker/v/petrovoronov/ecoflow-mqtt-to-svitlobot)](https://hub.docker.com/r/petrovoronov/ecoflow-mqtt-to-svitlobot)
[![Docker Pulls](https://img.shields.io/docker/pulls/petrovoronov/ecoflow-mqtt-to-svitlobot)](https://hub.docker.com/r/petrovoronov/ecoflow-mqtt-to-svitlobot)
[![GitHub license](https://img.shields.io/github/license/PetroVoronov/ecoflow-mqtt-to-svitlobot)](LICENSE)
[![GitHub last commit](https://img.shields.io/github/last-commit/PetroVoronov/ecoflow-mqtt-to-svitlobot)](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/commits/main)
[![GitHub issues](https://img.shields.io/github/issues/PetroVoronov/ecoflow-mqtt-to-svitlobot)](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/PetroVoronov/ecoflow-mqtt-to-svitlobot)](https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot/pulls)

## Про проект

Цей проєкт інтегрує брокер MQTT від Ecoflow з API СвітлоБота  для моніторингу та звітування про наявність або відсутність вхідної змінної напруги на пристрої Ecoflow.

## Функції

- Підключення до брокера MQTT від Ecoflow;
- Підписка на теми MQTT для моніторингу параметрів вхідної змінної напруги;
- Журналювання та звітування про зміни статусу вхідної змінної напруги через API СвітлоБота.

## Вимоги

- Пристрій Ecoflow: протестовано з Ecoflow DELTA Pro. Має працювати з іншими пристроями Ecoflow, які підтримують MQTT. (Будь ласка, зверніться до [EcoFlow to Prometheus exporter](https://github.com/berezhinskiy/ecoflow_exporter)).
- Встановлений Node.js або Docker.
- Пристрій Ecoflow (серійний номер) та облікові дані розробника з [EcoFlow Developer Platform](https://developer.ecoflow.com/).
- Зареєстрований канал [SvitloBot](https://svitlobot.in.ua/) та ключ каналу.

## Встановлення

### Встановлення Docker образу

```sh
docker pull petrovoronov/ecoflow-mqtt-to-svitlobot
```

### Встановлення Node.js з вихідного коду

1. Клонуйте репозиторій:
    ```sh
    git clone https://github.com/PetroVoronov/ecoflow-mqtt-to-svitlobot.git
    cd ecoflow-mqtt-to-svitlobot
    ```

2. Встановіть залежності:
    ```sh
    npm install
    ```

## Передача базових параметрів конфігурації
Базові параметри конфігурації, включно з обліковими даними Ecoflow і СвітлоБота, можуть передаватися як змінні середовища:

```sh
export ECOFLOW_USERNAME=your_ecoflow_username
export ECOFLOW_PASSWORD=your_ecoflow_password
export ECOFLOW_DEVICE_SN=your_ecoflow_device_sn
export SVITLOBOT_CHANNEL_KEY=your_svitlobot_channel_key
```

або ви можете пропустити цей крок, і програма попросить вас ввести їх інтерактивно.

Після першого запуску ці параметри будуть збережені в каталозі `config` і будуть використовуватися для наступних запусків.
Таким чином, вас попросять ввести параметри лише один раз (або ви повинні передати їх як змінні середовища лише під час першого запуску).

**Важливе зауваження: якщо ви хочете змінити параметри, вам потрібно знову передати їх як змінні середовища в будь-який час.**

## Опції командного рядка

Програму можна налаштувати за допомогою таких параметрів командного рядка:

| Параметр                        | Скорочення | Опис                                                                                           | Тип     | Значення за замовчуванням | Обов'язковий |
|---------------------------------|------------|------------------------------------------------------------------------------------------------|---------|---------------------------|--------------|
| `--errors-count-max`            | `-e`       | Максимальна кількість помилок для пінгу SvitloBot                                               | Number  | `5`                       | Ні           |
| `--svitlobot-update-interval`   | `-i`       | Оновлювати статус SvitloBot кожні X секунд                                                     | Number  | `60`                      | Ні           |
| `--keep-alive`                  | `-k`       | Перевіряти, чи клієнт MQTT живий кожні Y інтервали оновлення                                    | Number  | `3`                       | Ні           |
| `--log-ping`                    |            | Логувати статус "ping" API SvitloBot                                                           | Boolean |                           | Ні           |
| `--log-alive-status-interval`   | `-l`       | Логувати статус живого клієнта MQTT кожні Z хвилин                                             | Number  | `0`                       | Ні           |
| `--debug`                       | `-d`       | Рівень налагодження логування                                                                   | Boolean |                           | Ні           |

## Запуск програми

### Node.js

Приклад з усіма можливими параметрами командного рядка:

```sh
node src/index.js -i 60 -k 3 -l 60 -d true
```

### Docker

За замовчуванням програма запускається без додаткових параметрів командного рядка.

Через обмеження Docker-середовища програма не зможе інтерактивно запитувати відсутні параметри конфігурації. Саме тому необхідно виконати перший запуск у інтерактивному режимі, щоб надати відсутні параметри.

#### Об'єми Docker

**Необхідно змонтувати каталог даних програми в контейнер:**
- `/app/config` - для даних програми, включаючи конфігурації. Обов'язково для монтування!
Ви можете змонтувати будь-який локальний каталог на хост-системі або об'єм Docker.

#### Перше запускання Docker

Отже, перше запускання має виглядати як одне з наведеного нижче:

- для роботи і встановлення всіх основних параметрів конфігурації в інтерактивному режимі:
    ```sh
    docker run -it --name ecoflow-mqtt-to-svitlobot \
        -v /path/to/your/config:/app/config \
        petrovoronov/ecoflow-mqtt-to-svitlobot:latest
    ```

- для роботи і встановлення всіх основних параметрів конфігурації через змінні середовища:
    ```sh
    docker run -d --name ecoflow-mqtt-to-svitlobot \
        -v /path/to/your/config:/app/config \
        -e ECOFLOW_USERNAME=your_ecoflow_username \
        -e ECOFLOW_PASSWORD=your_ecoflow_password \
        -e ECOFLOW_DEVICE_SN=your_ecoflow_device_sn \
        -e SVITLOBOT_CHANNEL_KEY=your_svitlobot_channel_key \
        petrovoronov/ecoflow-mqtt-to-svitlobot:latest
    ```

**Важлива примітка: вкажіть усі потрібні пізніше параметри командного рядка під час першого запуску!**

Після першого запуску застосунок збереже параметри конфігурації та додаткову інформацію - будь ласка, зупиніть контейнер, натиснувши `Ctrl+C`, і запустіть його знову за допомогою команд із наступного розділу.

#### Наступні запуски Docker

Після першого запуску ви можете запускати застосунок із тими самими параметрами конфігурації, що й під час попереднього запуску, без додаткових параметрів командного рядка.

Щоб запустити застосунок, виконайте наступну команду:

```sh
docker start ecoflow-mqtt-to-svitlobot
```

Щоб зупинити застосунок, виконайте наступну команду:

```sh
docker stop ecoflow-mqtt-to-svitlobot
```

### Docker Compose

Щоб запустити застосунок за допомогою Docker Compose, створіть файл `docker-compose.yml` з наступним вмістом:

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

Замініть `/path/to/your/config` на фактичний шлях на вашій системі, де ви хочете зберігати дані застосунку.

Потім виконайте наступну команду для запуску застосунку:

```sh
docker-compose up -d
```

Це запустить застосунок зі вказаними параметрами конфігурації.

## Ліцензія

Цей проект ліцензовано за ліцензією MIT – див. файл [LICENSE](LICENSE) для деталей.