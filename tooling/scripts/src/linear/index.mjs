import { IssueRelationType, LinearClient } from "@linear/sdk";

/**
 * @typedef {{ client?: LinearClient, flags: Record<string, string>, positionals: string[] }} CommandContext
 */

/** @type {Record<string, (ctx: CommandContext) => Promise<void>>} */
const commands = {
	help: handleHelp,
	"projects:list": handleProjectsList,
	"projects:create": handleProjectsCreate,
	"projects:dependency": handleProjectsDependency,
	"milestones:list": handleMilestonesList,
	"milestones:create": handleMilestonesCreate,
	"issues:create": handleIssuesCreate,
	"issues:view": handleIssuesView,
	"issues:set-milestone": handleIssuesSetMilestone,
	"issues:start": handleIssuesStart,
	"issues:close": handleIssuesClose,
	"issues:dependency": handleIssuesDependency,
};

async function main() {
	try {
		const { flags, positionals } = parseArgs(process.argv.slice(2));
		const commandParts = positionals.length > 0 ? positionals : ["help"];
		const resource = commandParts[0];
		const action = commandParts[1];
		const commandKey = action
			? `${resource}:${action}`
			: (resource ?? "help");
		const handler = commands[commandKey.toLowerCase()] ?? commands.help;

		const consumedSegments = commandKey.split(":").length;
		const remainingPositionals =
			handler === commands.help
				? []
				: commandParts.slice(consumedSegments);

		if (handler === commands.help) {
			await handler({ flags, positionals: remainingPositionals });
			return;
		}

		const client = createClient();
		await handler({ client, flags, positionals: remainingPositionals });
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`\u001b[31m[linear]\u001b[0m ${message}`);
		process.exitCode = 1;
	}
}

/**
 * @param {string[]} argv
 */
function parseArgs(argv) {
	const flags = /** @type {Record<string, string>} */ ({});
	const positionals = [];

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg.startsWith("--")) {
			const withoutPrefix = arg.slice(2);
			if (withoutPrefix.length === 0) {
				continue;
			}

			const [rawKey, explicitValue] = withoutPrefix.split("=", 2);
			const key = rawKey.toLowerCase();

			if (explicitValue !== undefined) {
				flags[key] = explicitValue;
				continue;
			}

			const next = argv[index + 1];
			if (next && !next.startsWith("-")) {
				flags[key] = next;
				index += 1;
			} else {
				flags[key] = "true";
			}
		} else {
			positionals.push(arg);
		}
	}

	return { flags, positionals };
}

function createClient() {
	const apiKey = process.env.LINEAR_API_KEY;
	if (!apiKey) {
		throw new Error(
			"Missing LINEAR_API_KEY in environment. Add it to .env to use the Linear CLI helpers.",
		);
	}
	return new LinearClient({ apiKey });
}

async function handleHelp() {
	console.log(`Linear CLI helpers

Usage:
  pnpm --filter @repo/scripts linear <resource> <action> [options]

Resources & actions:
  projects list [--query <text>]                           List projects (filter by name or slug).
  projects create --name <text> [flags]                    Create a new project.
     Optional flags: --description <markdown>, --target <YYYY-MM-DD>, --color <hex>
  projects dependency --blocked <ref> --blocking <ref>     Link projects with a blocking dependency.
                         [--remove --id <relationId>]      Remove a dependency by id.
  milestones list --project <id|slug|name>                 List milestones for a project.
  milestones create --project <ref> --name <text> [flags]  Create a milestone for a project.
     Optional flags: --description <markdown>, --target <YYYY-MM-DD>, --sort <number>
  issues create --title <text> --project <ref> [flags]    Create a new issue.
     Optional flags: --description <markdown>, --priority <0-4>, --labels <comma-separated>
  issues view --issue <key>                               View issue details.
  issues set-milestone --issue <key> --project <ref> --milestone <name|id>
                                                          Attach an issue to a project milestone.
  issues start --issue <key>                              Mark an issue as In Progress.
  issues close --issue <key>                              Mark an issue as Done.
  issues dependency --blocked <key> --blocking <key>      Mark one issue as blocked by another.

Examples:
  pnpm --filter @repo/scripts linear projects list
  pnpm --filter @repo/scripts linear projects create --name "My New Project" --description "Project description"
  pnpm --filter @repo/scripts linear milestones create --project "Testing Initiative" --name "Epic 1"
  pnpm --filter @repo/scripts linear issues create --title "Bug title" --project Integrations --priority 1
  pnpm --filter @repo/scripts linear issues start --issue PRA-10
  pnpm --filter @repo/scripts linear issues close --issue PRA-10
  pnpm --filter @repo/scripts linear issues dependency --blocked PRA-8 --blocking PRA-6
`);
}

/** @param {CommandContext} context */
async function handleProjectsList(context) {
	const client = requireClient(context);
	const { flags } = context;
	const query = flags.query?.toLowerCase();
	const connection = await client.projects({
		first: 100,
		includeArchived: false,
	});

	const projects = connection.nodes.filter((project) => {
		if (!query) {
			return true;
		}
		const haystack = [project.name, project.slugId, project.id]
			.filter(Boolean)
			.map((value) => value.toLowerCase());
		return haystack.some((value) => value.includes(query));
	});

	if (projects.length === 0) {
		console.log("No projects found.");
		return;
	}

	console.log("ID\tSLUG\tNAME");
	for (const project of projects) {
		console.log(`${project.id}\t${project.slugId ?? "-"}\t${project.name}`);
	}
}

/** @param {CommandContext} context */
async function handleProjectsCreate(context) {
	const client = requireClient(context);
	const { flags } = context;
	const name = requireFlag(flags, "name");
	const description = flags.description;
	const targetDate = flags.target;
	const color = flags.color;

	// Get the first team to associate the project with
	const teams = await client.teams({ first: 1 });
	if (teams.nodes.length === 0) {
		throw new Error(
			"No teams found in workspace. Projects require a team.",
		);
	}
	const team = teams.nodes[0];

	const payload = await client.createProject({
		name,
		description,
		targetDate,
		color,
		teamIds: [team.id],
	});

	if (!payload.success) {
		throw new Error("Linear API reported failure when creating project.");
	}

	const project = await payload.project;
	if (!project) {
		throw new Error(
			"Project creation succeeded but no project was returned.",
		);
	}

	console.log(
		`Created project "${project.name}" (${project.id}) with slug ${project.slugId ?? "-"}.`,
	);
	console.log(`URL: ${project.url}`);
}

/** @param {CommandContext} context */
async function handleProjectsDependency(context) {
	const client = requireClient(context);
	const { flags } = context;

	const shouldRemove =
		Object.hasOwn(flags, "remove") || Object.hasOwn(flags, "delete");

	if (shouldRemove) {
		const relationId = requireFlag(flags, "id");
		const payload = await client.deleteProjectRelation(relationId);
		if (!payload.success) {
			throw new Error(`Failed to delete project relation ${relationId}.`);
		}
		console.log(`Deleted project relation ${relationId}.`);
		return;
	}

	const blockedRef = requireFlag(flags, "blocked");
	const blockingRef = requireFlag(flags, "blocking");
	const type = flags.type ?? "dependency";
	const anchor = flags.anchor ?? "end";
	const relatedAnchor = flags["related-anchor"] ?? "start";

	const blockingProject = await resolveProject(client, blockingRef);
	const blockedProject = await resolveProject(client, blockedRef);

	if (blockingProject.id === blockedProject.id) {
		throw new Error("Blocked and blocking projects must be different.");
	}

	const payload = await client.createProjectRelation({
		projectId: blockingProject.id,
		relatedProjectId: blockedProject.id,
		type,
		anchorType: anchor,
		relatedAnchorType: relatedAnchor,
	});

	if (!payload.success) {
		throw new Error(
			`Failed to create project dependency between ${blockingProject.name} and ${blockedProject.name}.`,
		);
	}

	const relation = await payload.projectRelation;
	const relationId = relation?.id ?? "unknown";
	console.log(
		`Linked project ${blockedProject.name} as blocked by ${blockingProject.name}. Relation id: ${relationId}`,
	);
}

/** @param {CommandContext} context */
async function handleMilestonesList(context) {
	const client = requireClient(context);
	const { flags } = context;
	const projectRef = requireFlag(flags, "project");
	const project = await resolveProject(client, projectRef);
	const milestones = await fetchMilestones(project);

	if (milestones.length === 0) {
		console.log(`Project "${project.name}" has no milestones yet.`);
		return;
	}

	console.log(`Milestones for ${project.name} (${project.id}):`);
	for (const milestone of milestones) {
		const target = milestone.targetDate ?? "—";
		console.log(`- ${milestone.name} (${milestone.id}) target=${target}`);
	}
}

/** @param {CommandContext} context */
async function handleMilestonesCreate(context) {
	const client = requireClient(context);
	const { flags } = context;
	const projectRef = requireFlag(flags, "project");
	const name = requireFlag(flags, "name");
	const description = flags.description;
	const target = flags.target;
	const sort = flags.sort ? Number.parseFloat(flags.sort) : undefined;
	if (flags.sort && Number.isNaN(sort)) {
		throw new Error("Provided --sort value is not a number.");
	}

	const project = await resolveProject(client, projectRef);

	const payload = await client.createProjectMilestone({
		projectId: project.id,
		name,
		description,
		targetDate: target,
		sortOrder: sort,
	});

	if (!payload.success) {
		throw new Error("Linear API reported failure when creating milestone.");
	}

	const milestone = await payload.projectMilestone;
	if (!milestone) {
		throw new Error(
			"Milestone creation succeeded but no milestone was returned.",
		);
	}

	console.log(
		`Created milestone "${milestone.name}" (${milestone.id}) for project ${project.name} (${project.id}).`,
	);
}

/** @param {CommandContext} context */
async function handleIssuesCreate(context) {
	const client = requireClient(context);
	const { flags } = context;
	const title = requireFlag(flags, "title");
	const projectRef = requireFlag(flags, "project");
	const description = flags.description;
	const priorityStr = flags.priority;
	const labelsStr = flags.labels;

	// Parse priority (0-4, where 0 is no priority, 1 is urgent, 2 is high, 3 is medium, 4 is low)
	const priority =
		priorityStr !== undefined
			? Number.parseInt(priorityStr, 10)
			: undefined;
	if (
		priorityStr !== undefined &&
		(Number.isNaN(priority) || priority < 0 || priority > 4)
	) {
		throw new Error("Priority must be a number between 0 and 4.");
	}

	const project = await resolveProject(client, projectRef);

	// Get the team from the project
	const teams = await project.teams();
	if (teams.nodes.length === 0) {
		throw new Error(`Project "${project.name}" has no associated teams.`);
	}
	const team = teams.nodes[0];

	// Parse labels if provided
	let labelIds;
	if (labelsStr) {
		const labelNames = labelsStr.split(",").map((l) => l.trim());
		const teamLabels = await team.labels();
		labelIds = [];
		for (const labelName of labelNames) {
			const label = teamLabels.nodes.find(
				(l) => l.name.toLowerCase() === labelName.toLowerCase(),
			);
			if (label) {
				labelIds.push(label.id);
			}
		}
	}

	const payload = await client.createIssue({
		teamId: team.id,
		projectId: project.id,
		title,
		description,
		priority,
		labelIds,
	});

	if (!payload.success) {
		throw new Error("Linear API reported failure when creating issue.");
	}

	const issue = await payload.issue;
	if (!issue) {
		throw new Error("Issue creation succeeded but no issue was returned.");
	}

	console.log(
		`Created issue ${issue.identifier}: "${issue.title}" (${issue.id}) in project ${project.name}.`,
	);
	console.log(`URL: ${issue.url}`);
}

/** @param {CommandContext} context */
async function handleIssuesView(context) {
	const client = requireClient(context);
	const { flags } = context;
	const issueRef = requireFlag(flags, "issue");
	const issue = await resolveIssue(client, issueRef);

	const state = await issue.state;
	const team = await issue.team;
	const project = await issue.project;
	const assignee = await issue.assignee;
	const labels = await issue.labels();

	console.log(`Issue: ${issue.identifier}`);
	console.log(`Title: ${issue.title}`);
	console.log(`State: ${state?.name ?? "Unknown"}`);
	console.log(`Priority: ${issue.priority ?? "None"}`);
	console.log(`Team: ${team?.name ?? "Unknown"}`);
	console.log(`Project: ${project?.name ?? "None"}`);
	console.log(`Assignee: ${assignee?.name ?? "Unassigned"}`);
	console.log(
		`Labels: ${labels.nodes.map((l) => l.name).join(", ") || "None"}`,
	);
	console.log(`URL: ${issue.url}`);
	if (issue.description) {
		console.log(`\nDescription:\n${issue.description}`);
	}
}

/** @param {CommandContext} context */
async function handleIssuesSetMilestone(context) {
	const client = requireClient(context);
	const { flags } = context;
	const issueRef = requireFlag(flags, "issue");
	const projectRef = requireFlag(flags, "project");
	const milestoneRef = requireFlag(flags, "milestone");

	const project = await resolveProject(client, projectRef);
	const issue = await resolveIssue(client, issueRef);
	const milestone = await resolveMilestone(client, project, milestoneRef);

	const payload = await client.updateIssue(issue.id, {
		projectId: project.id,
		projectMilestoneId: milestone.id,
	});

	if (!payload.success) {
		throw new Error(
			`Failed to attach issue ${issue.identifier} to milestone ${milestone.name}.`,
		);
	}

	console.log(
		`Linked issue ${issue.identifier} (${issue.id}) to milestone "${milestone.name}" (${milestone.id}) on project ${project.name}.`,
	);
}

/** @param {CommandContext} context */
async function handleIssuesStart(context) {
	const client = requireClient(context);
	const { flags } = context;
	const issueRef = requireFlag(flags, "issue");
	const issue = await resolveIssue(client, issueRef);

	// Fetch the team's workflow states
	const team = await issue.team;
	if (!team) {
		throw new Error(`Could not fetch team for issue ${issue.identifier}.`);
	}

	const states = await team.states();
	const inProgressState = states.nodes.find(
		(state) => state.type === "started",
	);

	if (!inProgressState) {
		throw new Error(
			`Could not find "In Progress" state for team ${team.name}.`,
		);
	}

	if (issue.stateId === inProgressState.id) {
		console.log(`Issue ${issue.identifier} is already In Progress.`);
		return;
	}

	const payload = await client.updateIssue(issue.id, {
		stateId: inProgressState.id,
	});

	if (!payload.success) {
		throw new Error(`Failed to move ${issue.identifier} to In Progress.`);
	}

	console.log(`Moved ${issue.identifier} (${issue.id}) to In Progress.`);
}

/** @param {CommandContext} context */
async function handleIssuesClose(context) {
	const client = requireClient(context);
	const { flags } = context;
	const issueRef = requireFlag(flags, "issue");
	const issue = await resolveIssue(client, issueRef);

	// Fetch the team's workflow states
	const team = await issue.team;
	if (!team) {
		throw new Error(`Could not fetch team for issue ${issue.identifier}.`);
	}

	const states = await team.states();
	const doneState = states.nodes.find((state) => state.type === "completed");

	if (!doneState) {
		throw new Error(`Could not find "Done" state for team ${team.name}.`);
	}

	if (issue.stateId === doneState.id) {
		console.log(`Issue ${issue.identifier} is already marked as Done.`);
		return;
	}

	const payload = await client.updateIssue(issue.id, {
		stateId: doneState.id,
	});

	if (!payload.success) {
		throw new Error(`Failed to move ${issue.identifier} to Done.`);
	}

	console.log(`Moved ${issue.identifier} (${issue.id}) to Done.`);
}

/** @param {CommandContext} context */
async function handleIssuesDependency(context) {
	const client = requireClient(context);
	const { flags } = context;
	const blockedRef = requireFlag(flags, "blocked");
	const blockingRef = requireFlag(flags, "blocking");

	const blockedIssue = await resolveIssue(client, blockedRef);
	const blockingIssue = await resolveIssue(client, blockingRef);

	if (blockedIssue.id === blockingIssue.id) {
		throw new Error("Blocked and blocking issues must be different.");
	}

	const payload = await client.createIssueRelation({
		type: IssueRelationType.Blocks,
		issueId: blockingIssue.id,
		relatedIssueId: blockedIssue.id,
	});

	if (!payload.success) {
		throw new Error(
			`Linear API reported failure when linking ${blockingIssue.identifier} -> ${blockedIssue.identifier}.`,
		);
	}

	const relationId = payload.issueRelation
		? await payload.issueRelation.id
		: "unknown";
	console.log(
		`Registered ${blockedIssue.identifier} as blocked by ${blockingIssue.identifier}. Relation id: ${relationId}`,
	);
}

/**
 * @param {Record<string, string>} flags
 * @param {string} key
 */
function requireFlag(flags, key) {
	const value = flags[key.toLowerCase()];
	if (!value) {
		throw new Error(`Missing required flag "--${key}".`);
	}
	return value;
}

/**
 * @param {LinearClient} client
 * @param {string} ref
 */
async function resolveProject(client, ref) {
	const normalized = ref.trim().toLowerCase();

	const byId = await tryGet(async () => client.project(ref));
	if (byId) {
		return byId;
	}

	const connection = await client.projects({
		first: 200,
		includeArchived: false,
	});
	const project =
		connection.nodes.find((item) => item.id === ref) ??
		connection.nodes.find(
			(item) => item.slugId?.toLowerCase() === normalized,
		) ??
		connection.nodes.find((item) => item.name.toLowerCase() === normalized);

	if (!project) {
		throw new Error(`Could not resolve project from reference "${ref}".`);
	}
	return project;
}

/**
 * @param {LinearClient} client
 * @param {string} ref
 */
async function resolveIssue(client, ref) {
	const trimmed = ref.trim();

	const byId = await tryGet(async () => client.issue(trimmed));
	if (byId) {
		return byId;
	}

	const search = await client.issueSearch({ query: trimmed, first: 10 });
	const issue =
		search.nodes.find(
			(node) => node.identifier.toLowerCase() === trimmed.toLowerCase(),
		) ?? search.nodes.find((node) => node.id === trimmed);

	if (!issue) {
		throw new Error(`Could not resolve issue from reference "${ref}".`);
	}

	return issue;
}

/**
 * @param {LinearClient} client
 * @param {import("@linear/sdk").Project} project
 * @param {string} ref
 */
async function resolveMilestone(client, project, ref) {
	const normalized = ref.trim().toLowerCase();

	const milestoneById = await tryGet(async () =>
		client.projectMilestone(ref),
	);
	if (milestoneById && milestoneById.projectId === project.id) {
		return milestoneById;
	}

	const milestones = await fetchMilestones(project);
	const milestone =
		milestones.find((item) => item.id === ref) ??
		milestones.find((item) => item.name.toLowerCase() === normalized);

	if (!milestone) {
		throw new Error(
			`Could not resolve milestone "${ref}" for project ${project.name}.`,
		);
	}
	return milestone;
}

/**
 * @param {import("@linear/sdk").Project} project
 */
async function fetchMilestones(project) {
	const result = await project.projectMilestones({ first: 100 });
	const milestones = [...result.nodes];

	while (result.pageInfo.hasNextPage) {
		const previousLength = result.nodes.length;
		await result.fetchNext();
		const newItems = result.nodes.slice(previousLength);
		milestones.push(...newItems);
	}

	return milestones;
}

/**
 * @template T
 * @param {() => Promise<T>} factory
 * @returns {Promise<T | undefined>}
 */
async function tryGet(factory) {
	try {
		return await factory();
	} catch {
		return undefined;
	}
}

/**
 * @param {CommandContext} context
 * @returns {LinearClient}
 */
function requireClient(context) {
	if (!context.client) {
		throw new Error("Linear client is not initialised for this command.");
	}
	return context.client;
}

void main();
