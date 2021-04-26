const LOG_PERIOD = 1000 * 60 * 60 * 24;
const DIVIDER_SIGN = '*';
const DIVIDER_COUNT = 5;
const DIVIDER = DIVIDER_SIGN.repeat(DIVIDER_COUNT);
const LIST_REG_EXP = new RegExp(`\\${DIVIDER_SIGN}{${DIVIDER_COUNT}}(.|\\s)+?\\${DIVIDER_SIGN}{${DIVIDER_COUNT}}`, 'g');

module.exports = class Logger {
    constructor(shortSuccessMessage = 'Success') {
        this._shortMessage = shortSuccessMessage;
        this._logHistory = '';
        this._startingMessage = '';
        this._logInConsole = true;
        this._errorsExists = false;
        this._shortMessage = '';
    }

    getLogHistory(shortOnSuccess) {
        const message = shortOnSuccess && !this._errorsExists ? this._shortMessage : this._logHistory.trim();
        return `${DIVIDER}\n${this._startingMessage}\n\n${message}\n${DIVIDER}`;
    }

    reset() {
        this._startingMessage = Logger.generateStartMessage(new Date().toISOString());
        this._logHistory = '';
        this._errorsExists = false;
    }

    log(...args) {
        if (this._logInConsole) {
            console.log(...args);
        }
        args.forEach((message) => {
            this._logHistory += `\n${message}`;
        });
    }

    error(...args) {
        if (this._logInConsole) {
            console.error(...args);
        }
        args.forEach((message) => {
            this._logHistory += `\n\nvvv  ERROR  vvv\n${message}`;
        });
        this._errorsExists = true;
    }

    setConsoleLogState(state) {
        this._logInConsole = state;
    }

    static generateStartMessage(date) {
        return `Start Logging at ${date}  -------------------->`;
    }

    static prepareLog(logList) {
        const DATE_REG = new RegExp(Logger.generateStartMessage('(.+?)'));
        return logList.match(LIST_REG_EXP).filter((logItem) => {
            const matchResult = logItem.match(DATE_REG);
            const stringDate = matchResult && matchResult[1] || '';
            const logDate = new Date(stringDate).getTime();
            const currentDate = Date.now();
            return !isNaN(logDate) && logDate > currentDate - LOG_PERIOD;
        }).join('\n\n\n');
    }
};
