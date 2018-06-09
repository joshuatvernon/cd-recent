#!/usr/bin/env node

const Program = require('commander');
const fse = require('fs-extra');
const chalk = require('chalk');

const configFilePath = __dirname + '/config.json';

let config;
let limit;
let recentlyVisitedDirectories = [];

Program
    .version('0.1.0')
    .usage('[options]')
    .option('-l --limit [limit]', 'sets limit of recent directories to list')
    .option('-d --defaultLimit [default limit]', 'set default number of recent directories to list')
    .option('-H --historyFile [path to history file]', 'full path to history file')
    .parse(process.argv);

run();

function run() {
    loadConfig();

    if (Program.historyFile) {
        const historyFilePath = Program.historyFile;

        setHistory(historyFilePath);
    }

    if (Program.limit) {
        limit = Number(Program.limit);
        if (isNaN(limit)) {
            // default limit argument passed in is not a number
            console.warn('Limit must be a number but was ' + chalk.red.bold(limit));
            process.exit();
        }
    }

    if (Program.defaultLimit) {
        const defaultLimit = Number(Program.defaultLimit);
        if (isNaN(defaultLimit)) {
            // default limit argument passed in is not a number
            console.warn('Default limit must be a number but was ' + chalk.red.bold(defaultLimit));
            process.exit();
        }
        saveDefaultLimit(defaultLimit);
    }

    if (!Program.historyFile && !Program.defaultLimit) {
        loadHistoryFile();

        printRecentlyVisitedDirectories();
    }
}

function saveConfig() {
    fse.outputJsonSync(configFilePath, config);
}

function loadConfig() {
    if (fse.existsSync(configFilePath)) {
        // config file exists; load config file
        config = fse.readJsonSync(configFilePath);
    } else {
        // config file doesn't exist; save default config file
        config = {
           historyFilePath: '',
           defaultLimit: 10
       };
       saveConfig();
    }
}

function setHistory(historyFilePath) {
    if (fse.existsSync(historyFilePath)) {
        // history file path exists; save history file path in config
        config.historyFilePath = historyFilePath;
        saveConfig();
        console.log(chalk.green.bold(historyFilePath) + ' saved!');
    } else {
        // history file path does not exist
        console.log(chalk.red.bold(historyFilePath) + ' history file does not exist');
        process.exit();
    }
}

function saveDefaultLimit(defaultLimit) {
    config.defaultLimit = defaultLimit;
    saveConfig();
}

function loadHistoryFile() {
    if (config.historyFilePath === '') {
        // history file path does not exist
        console.log(chalk.red.bold('History file is not set; try running ' + chalk.yellow.bold('cd-recent -h <history-file-path>')));
        process.exit();
    } else if (fse.existsSync(config.historyFilePath)) {
        // history file path exists; save history file path in config
        let historyFileLines = fse.readFileSync(config.historyFilePath, 'utf8').toString().split('\n');
        historyFileLines.forEach(function (line) {
            if (line.includes('cd ')) {
                match = line.split('cd ');
                recentlyVisitedDirectories.push(match[match.length-1]);
            }
        });
    } else {
        // history file path does not exist
        console.log(chalk.red.bold(config.historyFilePath) + ' history file does not exist; try running ' + chalk.yellow.bold('cd-recent -h <history-file-path>'));
        process.exit();
    }
}

function printRecentlyVisitedDirectories() {
    let currentLimit;
    if (limit) {
        currentLimit = limit;
    } else {
        currentLimit = config.defaultLimit;
    }
    for (let i = recentlyVisitedDirectories.length - 1; i >= recentlyVisitedDirectories.length - currentLimit; i--) {
        console.log(chalk.blue.bold(recentlyVisitedDirectories[i]));
    }
}
