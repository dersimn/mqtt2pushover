#!/usr/bin/env node

const pkg = require('./package.json');
const log = require('yalm');
const config = require('yargs')
    .env('MQTT2PUSHOVER')
    .usage(pkg.name + ' ' + pkg.version + '\n' + pkg.description + '\n\nUsage: $0 [options]')
    .describe('verbosity', 'possible values: "error", "warn", "info", "debug"')
    .describe('name', 'instance name. used as mqtt client id and as prefix for connected topic')
    .describe('mqtt-url', 'mqtt broker url. See https://github.com/mqttjs/MQTT.js#connect-using-a-url')
    .describe('pushover-user', 'Pushover user key')
    .describe('pushover-token', 'Pushover application key')
    .alias({
        h: 'help',
        m: 'mqtt-url',
        v: 'verbosity',
        u: 'pushover-user',
        t: 'pushover-token'
    })
    .default({
        name: 'pushover',
        'mqtt-url': 'mqtt://127.0.0.1'
    })
    .version()
    .help('help')
    .argv;
const MqttSmarthome = require('mqtt-smarthome-connect');
const Pushover = require('pushover-notifications');
const push = new Pushover({
    user: config.pushoverUser,
    token: config.pushoverToken
});

log.setLevel(config.verbosity);
log.info(pkg.name + ' ' + pkg.version + ' starting');
log.debug("loaded config: ", config);

log.info('mqtt trying to connect', config.mqttUrl);
const mqtt = new MqttSmarthome(config.mqttUrl, {
    logger: log,
    will: {topic: config.name + '/connected', payload: '0', retain: true}
});
mqtt.connect();

mqtt.on('connect', () => {
    log.info('mqtt connected', config.mqttUrl);
    mqtt.publish(config.name + '/connected', '1', {retain: true});
});

mqtt.subscribe(config.name + '/set/message', (topic, message, wildcard) => {
    if (typeof message === 'object') {
        push.send(message, (err, result) => {
            if (err) log.error(err);
            if (result) log.debug(result);
        });
    }
    if (typeof message === 'string') {
        push.send({
            message: message
        }, (err, result) => {
            if (err) log.error(err);
            if (result) log.debug(result);
        });
    }
});
