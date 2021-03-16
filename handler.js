'use strict';

const { tickerGenerator } = require('./functions/ticker');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
const _ = require('lodash');
const Logger = require('./functions/utils/logger');

const s3 = new AWS.S3();
const LOG_FILE = 'v1/log.txt';

module.exports.ticker = (event, context, callback) => {
    tickerGenerator()
        .then(({files, log}) => updateLog(log).then(() => files))
        .then((files) => {
            return Promise.all(_.map(files, (contents, filename) => {
                return s3.putObject({
                    Bucket: process.env.BUCKET,
                    Key: filename,
                    Body: contents,
                    ContentType: 'application/json',
                    ACL: 'public-read',
                    CacheControl: 'public, max-age=50',
                }).promise()
            }))
        })
        .then(v => callback(null, v), callback);
};

function updateLog(log) {
    return s3.getObject({
        Bucket: process.env.BUCKET,
        Key: LOG_FILE
    }).promise()
      .then((data) => Logger.prepareLog(data.Body.toString('ascii') || ''))
      .catch(() => '')
      .then((currentLog) =>  s3.putObject({
          Bucket: process.env.BUCKET,
          Key: LOG_FILE,
          Body: `${log}\n\n\n${currentLog}`.trim(),
          ContentType: 'text/plain',
          ACL: 'public-read',
          CacheControl: 'public, max-age=50',
      }).promise())
      .catch()
}
