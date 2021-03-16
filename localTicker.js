const { tickerGenerator } = require('./functions/ticker');
const fs = require('fs');
const _ = require('lodash');
const mkdirp = require('mkdirp');

tickerGenerator()
    .then(({files, log}) => {
        mkdirp.sync('./output/v1');
        _.each(files, (contents, filename) => {
            fs.writeFileSync('./output/' + filename, contents, 'utf8');
        });
        fs.writeFileSync('./output/v1/log.txt', log, 'utf8');
    });
