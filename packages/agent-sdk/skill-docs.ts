import fs from "node:fs/promises";
import path from "node:path";

export interface SkillDocumentation {
	/**
	 * Name of the skill (e.g., "user-authentication")
	 */
	name: string;

	/**
	 * Description of what the skill does
	 */
	description: string;

	/**
	 * Full markdown content for the skill documentation
	 */
	content: string;

	/**
	 * Directory path where the skill docs should be stored
	 * @default ".claude/skills"
	 */
	skillsDir?: string;
}

/**
 * Upsert (create or update) skill documentation in the Claude skills directory.
 *
 * This function creates a skill directory structure following Claude Code conventions:
 * - .claude/skills/<skill-name>/
 *   - SKILL.md (main documentation)
 *
 * @param doc - Skill documentation to upsert
 * @returns Promise resolving to the path of the created/updated SKILL.md file
 *
 * @example
 * ```typescript
 * await upsertSkillDocs({
 *   name: "user-auth",
 *   description: "Handle user authentication workflows",
 *   content: "# User Authentication\\n\\nThis skill..."
 * });
 * ```
 */
export async function upsertSkillDocs(
	doc: SkillDocumentation,
): Promise<string> {
	const baseDir = doc.skillsDir ?? ".claude/skills";
	const skillDir = path.join(baseDir, doc.name);
	const skillFilePath = path.join(skillDir, "SKILL.md");

	// Ensure the skill directory exists
	await fs.mkdir(skillDir, { recursive: true });

	// Write the skill documentation
	await fs.writeFile(skillFilePath, doc.content, "utf-8");

	return skillFilePath;
}

/**
 * Read skill documentation from the Claude skills directory.
 *
 * @param skillName - Name of the skill to read
 * @param skillsDir - Directory path where skill docs are stored
 * @returns Promise resolving to the skill content, or null if not found
 *
 * @example
 * ```typescript
 * const content = await readSkillDocs("user-auth");
 * if (content) {
 *   console.log(content);
 * }
 * ```
 */
export async function readSkillDocs(
	skillName: string,
	skillsDir = ".claude/skills",
): Promise<string | null> {
	const skillFilePath = path.join(skillsDir, skillName, "SKILL.md");

	try {
		const content = await fs.readFile(skillFilePath, "utf-8");
		return content;
	} catch {
		return null;
	}
}

/**
 * List all available skills in the Claude skills directory.
 *
 * @param skillsDir - Directory path where skill docs are stored
 * @returns Promise resolving to an array of skill names
 *
 * @example
 * ```typescript
 * const skills = await listSkills();
 * console.log(skills); // ["user-auth", "data-processing", ...]
 * ```
 */
export async function listSkills(
	skillsDir = ".claude/skills",
): Promise<string[]> {
	try {
		const entries = await fs.readdir(skillsDir, { withFileTypes: true });
		return entries
			.filter((entry) => entry.isDirectory())
			.map((dir) => dir.name);
	} catch {
		return [];
	}
}
