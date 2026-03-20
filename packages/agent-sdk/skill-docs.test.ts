import fs from "node:fs/promises";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { listSkills, readSkillDocs, upsertSkillDocs } from "./skill-docs";

vi.mock("node:fs/promises");

const mockMkdir = vi.mocked(fs.mkdir);
const mockWriteFile = vi.mocked(fs.writeFile);
const mockReadFile = vi.mocked(fs.readFile);
const mockReaddir = vi.mocked(fs.readdir);

describe("upsertSkillDocs", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockMkdir.mockResolvedValue(undefined);
		mockWriteFile.mockResolvedValue(undefined);
	});

	it("creates skill directory and writes SKILL.md with default skillsDir", async () => {
		const result = await upsertSkillDocs({
			name: "user-auth",
			description: "Handle user authentication",
			content: "# User Auth\n\nThis skill...",
		});

		expect(mockMkdir).toHaveBeenCalledWith(
			path.join(".claude/skills", "user-auth"),
			{ recursive: true },
		);
		expect(mockWriteFile).toHaveBeenCalledWith(
			path.join(".claude/skills", "user-auth", "SKILL.md"),
			"# User Auth\n\nThis skill...",
			"utf-8",
		);
		expect(result).toBe(
			path.join(".claude/skills", "user-auth", "SKILL.md"),
		);
	});

	it("uses custom skillsDir when provided", async () => {
		const result = await upsertSkillDocs({
			name: "data-processing",
			description: "Process data",
			content: "# Data Processing",
			skillsDir: "/custom/skills",
		});

		expect(mockMkdir).toHaveBeenCalledWith(
			path.join("/custom/skills", "data-processing"),
			{ recursive: true },
		);
		expect(result).toBe(
			path.join("/custom/skills", "data-processing", "SKILL.md"),
		);
	});
});

describe("readSkillDocs", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns skill content when file exists", async () => {
		mockReadFile.mockResolvedValue("# My Skill\n\nContent here");

		const result = await readSkillDocs("my-skill");

		expect(mockReadFile).toHaveBeenCalledWith(
			path.join(".claude/skills", "my-skill", "SKILL.md"),
			"utf-8",
		);
		expect(result).toBe("# My Skill\n\nContent here");
	});

	it("returns null when file does not exist", async () => {
		mockReadFile.mockRejectedValue(new Error("ENOENT: file not found"));

		const result = await readSkillDocs("missing-skill");

		expect(result).toBeNull();
	});

	it("uses custom skillsDir when provided", async () => {
		mockReadFile.mockResolvedValue("content");

		await readSkillDocs("my-skill", "/other/path");

		expect(mockReadFile).toHaveBeenCalledWith(
			path.join("/other/path", "my-skill", "SKILL.md"),
			"utf-8",
		);
	});
});

describe("listSkills", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns skill names from directory entries", async () => {
		mockReaddir.mockResolvedValue([
			{ name: "user-auth", isDirectory: () => true } as fs.Dirent,
			{ name: "data-processing", isDirectory: () => true } as fs.Dirent,
			{ name: "README.md", isDirectory: () => false } as fs.Dirent,
		]);

		const result = await listSkills();

		expect(mockReaddir).toHaveBeenCalledWith(".claude/skills", {
			withFileTypes: true,
		});
		expect(result).toEqual(["user-auth", "data-processing"]);
	});

	it("returns empty array when directory does not exist", async () => {
		mockReaddir.mockRejectedValue(new Error("ENOENT: no such file"));

		const result = await listSkills();

		expect(result).toEqual([]);
	});

	it("uses custom skillsDir when provided", async () => {
		mockReaddir.mockResolvedValue([]);

		await listSkills("/custom/path");

		expect(mockReaddir).toHaveBeenCalledWith("/custom/path", {
			withFileTypes: true,
		});
	});

	it("returns empty array when directory is empty", async () => {
		mockReaddir.mockResolvedValue([]);

		const result = await listSkills();

		expect(result).toEqual([]);
	});
});
