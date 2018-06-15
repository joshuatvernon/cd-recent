#!/usr/bin/env node

const program = require('commander');
const fse = require('fs-extra');
const chalk = require('chalk');
const expandTilde = require('expand-tilde');

const configFilePath = __dirname + '/config.json';
const dynamicHistoryLimit = 1000;

let config;
let limit;

program
    .version('1.1.2')
    .usage('[options]')
    .option('-a --add [full path of directory]', 'adds a recently visited directory to list')
    .option('-d --defaultLimit [default limit]', 'sets default number of recent directories to list')
    .option('-H --historyFile [full path to history file]', 'sets history file to parse when tracking retroactively')
    .option('-l --limit [limit]', 'sets limit of recent directories to list')
    .option('-r --reset', 'reset list of recently visited directories')
    .option('-t --toggle', 'toggle dynamic or retroactive recently visited directories tracking')
    .parse(process.argv);

run();

function run() {
    loadConfig();

    if (program.historyFile) {
        const historyFilePath = program.historyFile;

        setHistory(historyFilePath);
    }

    if (program.limit) {
        limit = Number(program.limit);
        if (isNaN(limit)) {
            // default limit argument passed in is not a number
            console.warn('Limit must be a number but was ' + chalk.red.bold(limit));
            process.exit();
        }
    }

    if (program.defaultLimit) {
        const defaultLimit = Number(program.defaultLimit);
        if (isNaN(defaultLimit)) {
            // default limit argument passed in is not a number
            console.warn('Default limit must be a number but was ' + chalk.red.bold(defaultLimit));
            process.exit();
        }
        saveDefaultLimit(defaultLimit);
    }

    if (program.toggle) {
        toggleManualHistory();
    }

    if (program.add) {
        let recentlyVisitedDirectory = program.add;
        addRecentlyVisitedDirectory(recentlyVisitedDirectory);
    }

    if (program.reset) {
        resetRecentlyVisitedDirectories();
    }

    if (!program.historyFile && !program.defaultLimit && !program.toggle && !program.add && !program.reset) {
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
            defaultLimit: 10,
            dynamicTracking: false,
            recentlyVisitedDirectories: []
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
        console.log('No history file with ' + chalk.red.bold(historyFilePath) + ' path exists');
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
        console.log('Retroactive tracking is ' + chalk.green.bold('on') + '; Either run ' + chalk.yellow.bold('cd-recent -H [full path to history file]') + ' to track your history file\n');
        console.log('Or better yet toggle dynamic tracking by running ' + chalk.yellow.bold('cd-recent -t') + ' then add the following to your ' + chalk.green.bold('.bashrc') + ' or ' + chalk.green.bold('.zshrc') + ' file:\n' + chalk.magenta.bold('function cd() {\n    builtin cd $1\n    cd-recent -a $(pwd)\n}'));
        process.exit();
    } else if (fse.existsSync(config.historyFilePath)) {
        // history file path exists; save history file path in config
        let historyFileLines = fse.readFileSync(config.historyFilePath, 'utf8').toString().split('\n');
        historyFileLines.forEach(function (line) {
            if (line.includes('cd ')) {
                match = line.split('cd ');
                config.recentlyVisitedDirectories.push(match[match.length - 1]);
            }
        });
    } else {
        // history file path does not exist
        console.log(chalk.red.bold(config.historyFilePath) + ' history file does not exist; try running ' + chalk.yellow.bold('cd-recent -h [full path to history file]'));
        process.exit();
    }
}

function toggleManualHistory() {
    // toggle manual entry and save it to the config file
    if (config.dynamicTracking) {
        config.dynamicTracking = false;
        console.log('Switched to ' + chalk.green.bold('retroactively') + ' tracking recently visited directories');
    } else {
        config.dynamicTracking = true;
        console.log('Switched to ' + chalk.green.bold('dynamically') + ' tracking recently visited directories');
    }
    saveConfig();
}

function addRecentlyVisitedDirectory(recentlyVisitedDirectory) {
    if (config.recentlyVisitedDirectories.length >= dynamicHistoryLimit) {
        config.recentlyVisitedDirectories = config.recentlyVisitedDirectories.slice(1)
    }
    config.recentlyVisitedDirectories.push(recentlyVisitedDirectory);
    saveConfig();
}

function resetRecentlyVisitedDirectories() {
    config.recentlyVisitedDirectories = [];
    saveConfig();
    console.log('Recently visited directories were successfully reset');
}

function isValidDirectoryPath(recentlyVisitedDirectory) {
    return fse.existsSync(expandTilde(recentlyVisitedDirectory));
}

function printRecentlyVisitedDirectories() {
    let currentLimit = limit ? limit : config.defaultLimit;

    if (!config.dynamicTracking) {
        // manual entry turned off; load history file
        loadHistoryFile();
    }

    let start = config.recentlyVisitedDirectories.length - 1;
    let end = config.recentlyVisitedDirectories.length - currentLimit;
    if (config.recentlyVisitedDirectories.length > 0) {
        for (let i = start; i >= end && i >= 0; i--) {
            if (isValidDirectoryPath(config.recentlyVisitedDirectories[i])) {
                console.log(chalk.green.bold(config.recentlyVisitedDirectories[i]));
            } else {
                console.log(config.recentlyVisitedDirectories[i]);
            }
        }
    } else {
        console.log('Couldn\'t find any recently visited directories to list');
    }
}
