#!/usr/bin/env node
import { Command } from 'commander';
import { start } from './commands/start';
import { save } from './commands/save';
import dotenv from 'dotenv';

dotenv.config();

const program = new Command();

program
  .name('snack-cli')
  .description('CLI for Expo Snack')
  .version('0.0.2');

program
  .command('start')
  .description('Start a Snack from the current directory')
  .option('--experimental-runtime', 'Use the experimental runtime endpoint')
  .action(start);

program
  .command('save')
  .description('Save the current Snack')
  .option('--experimental-runtime', 'Use the experimental runtime endpoint')
  .action(save);

program.parse();
