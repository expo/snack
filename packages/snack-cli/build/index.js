#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const start_1 = require("./commands/start");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const program = new commander_1.Command();
program
    .name('snack-cli')
    .description('CLI for Expo Snack')
    .version('1.0.0');
program
    .command('start')
    .description('Start a Snack from the current directory')
    .action(start_1.start);
program.parse();
