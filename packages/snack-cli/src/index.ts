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
  .version('1.0.0');

program
  .command('start')
  .description('Start a Snack from the current directory')
  .action(start);

program
  .command('save')
  .description('Save the current Snack')
  .action(save);

program.parse();
