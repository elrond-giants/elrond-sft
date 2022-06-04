#!/usr/bin/env node
import { argv, exit } from 'process';

import packageJson from '../package.json';
import { issueToken, mintSft, setRoles } from './issue-sft';

const COMMANDS = {
  issueToken: "issue-token",
  setRoles: "set-roles",
  mintSft: "mint-sft",
  addSftQuantity: "add-sft-quantity",
  burnSft: "burn-sft",
};

const args = argv;
const command = args ? args[2] : undefined;

// Show version number
if (command === "--version" || command === "-v") {
  console.log(packageJson.version);
  exit();
}

const availableCommands = Object.values(COMMANDS);

const commandsArray = [...availableCommands, "--version", "-v", "--help", "-h"];

const helpMsg = `========================\nAvailable commands:\n========================\n${commandsArray.join("\n")}`;

if (command === "--help" || command === "-h") {
  console.log(helpMsg);
  exit(9);
}

if (!command || !Object.values(COMMANDS).includes(command)) {
  console.log(
    `====================================================\nPlaese provide a proper command. Available commands:\n====================================================\n${commandsArray.join(
      "\n"
    )}`
  );
  exit(9);
}

switch (command) {
  case COMMANDS.issueToken:
    issueToken();
    break;
  case COMMANDS.setRoles:
    setRoles();
    break;
  case COMMANDS.mintSft:
    mintSft();
    break;
  case COMMANDS.addSftQuantity:
    console.log("Not Implemented");
    break;
  case COMMANDS.burnSft:
    console.log("Not Implemented");
    break;
  default:
    break;
}
