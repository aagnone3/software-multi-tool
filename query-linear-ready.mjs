import fs from "node:fs";
import https from "node:https";

// Load env file
const envPath = "./apps/web/.env.local";
const envContent = fs.readFileSync(envPath, "utf8");
const apiKey = envContent.match(/LINEAR_API_KEY=(.+)/)?.[1]?.trim();

if (!apiKey) {
	console.error("LINEAR_API_KEY not found in .env.local");
	process.exit(1);
}

const query = `
  query {
    issues(
      filter: {
        state: { type: { in: ["unstarted"] } }
        hasBlockedByRelations: { eq: false }
      }
      orderBy: updatedAt
      first: 50
    ) {
      nodes {
        identifier
        title
        state {
          name
          type
        }
        priority
        assignee {
          name
        }
        project {
          name
        }
        labels {
          nodes {
            name
          }
        }
      }
    }
  }
`;

const data = JSON.stringify({ query });

const options = {
	hostname: "api.linear.app",
	path: "/graphql",
	method: "POST",
	headers: {
		"Content-Type": "application/json",
		Authorization: apiKey,
		"Content-Length": data.length,
	},
};

const req = https.request(options, (res) => {
	let body = "";
	res.on("data", (chunk) => {
		body += chunk;
	});
	res.on("end", () => {
		const result = JSON.parse(body);
		if (result.errors) {
			console.error(
				"GraphQL Errors:",
				JSON.stringify(result.errors, null, 2),
			);
			process.exit(1);
		}

		const issues = result.data.issues.nodes;

		console.log("\n=== Linear Issues Ready for Work ===\n");

		if (issues.length === 0) {
			console.log(
				"No issues found with Ready status (groomed and ready for work)",
			);
			process.exit(0);
		}

		issues.forEach((issue) => {
			console.log(`[${issue.identifier}] ${issue.title}`);
			console.log(`  Status: ${issue.state.name} (${issue.state.type})`);
			console.log(`  Priority: ${issue.priority || "None"}`);
			console.log(`  Assignee: ${issue.assignee?.name || "Unassigned"}`);
			if (issue.project) {
				console.log(`  Project: ${issue.project.name}`);
			}
			if (issue.labels.nodes.length > 0) {
				console.log(
					`  Labels: ${issue.labels.nodes.map((l) => l.name).join(", ")}`,
				);
			}
			console.log("");
		});

		console.log(`Total: ${issues.length} issues`);
	});
});

req.on("error", (e) => {
	console.error("Request failed:", e.message);
	process.exit(1);
});

req.write(data);
req.end();
