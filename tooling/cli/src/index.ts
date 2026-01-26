#!/usr/bin/env node
import { Command } from "commander";
import { featuresCommand } from "./commands/features.js";

const program = new Command();

program
	.name("mt")
	.description("Developer CLI for software-multi-tool")
	.version("0.0.0");

program.addCommand(featuresCommand);

program.parse();
