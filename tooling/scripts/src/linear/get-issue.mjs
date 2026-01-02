import { LinearClient } from "@linear/sdk";

const apiKey = process.env.LINEAR_API_KEY;
if (!apiKey) {
	console.error("Missing LINEAR_API_KEY in environment.");
	process.exit(1);
}

const issueKey = process.argv[2];
if (!issueKey) {
	console.error("Usage: node get-issue.mjs <issue-key>");
	process.exit(1);
}

const client = new LinearClient({ apiKey });

try {
	const issue = await client.issue(issueKey);
	const state = await issue.state;
	const assignee = await issue.assignee;

	console.log("Issue:", issue.identifier);
	console.log("Title:", issue.title);
	console.log("Description:", issue.description || "(no description)");
	console.log("State:", state.name);
	console.log("Assignee:", assignee?.name || "Unassigned");
	console.log("Priority:", issue.priority);
	console.log("URL:", issue.url);
} catch (error) {
	console.error("Error fetching issue:", error.message);
	process.exit(1);
}
