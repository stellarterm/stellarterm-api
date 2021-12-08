const { tickerGenerator } = require('./functions/ticker');
const { generate } = require('./functions/cmc-data-generator');
const fs = require('fs');
const _ = require('lodash');
const mkdirp = require('mkdirp');

tickerGenerator()
    .then(({files, log}) => {
        mkdirp.sync('./output/v1/');
        mkdirp.sync('./output/cmc/v1/');
        _.each(files, (contents, filename) => {
            fs.writeFileSync('./output/' + filename, contents, 'utf8');
        });
        fs.writeFileSync('./output/v1/log.txt', log, 'utf8');
        return generate();
    })
    .then((data) => {
        Object.entries(data).forEach(([filename, value]) => {
            fs.writeFileSync(`./output/${filename}`, value, 'utf8');
        });
    });
