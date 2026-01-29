import { describe, expect, it, vi } from "vitest";
import { getAudioStorageKey } from "./audio-storage";

// Mock the storage provider
vi.mock("@repo/storage", () => ({
	getDefaultSupabaseProvider: vi.fn(() => ({
		upload: vi.fn(),
		delete: vi.fn(),
		exists: vi.fn(),
		getSignedDownloadUrl: vi.fn(),
	})),
	shouldUseSupabaseStorage: vi.fn(() => false),
}));

describe("audio-storage", () => {
	describe("getAudioStorageKey", () => {
		it("generates correct storage key with organization prefix", () => {
			const key = getAudioStorageKey("org-123", "my-recording.mp3");
			expect(key).toMatch(
				/^organizations\/org-123\/files\/\d+-my-recording\.mp3$/,
			);
		});

		it("includes timestamp in the key", () => {
			const before = Date.now();
			const key = getAudioStorageKey("org-456", "audio.wav");
			const after = Date.now();

			// Extract timestamp from key
			const match = key.match(/\/(\d+)-/);
			expect(match).toBeTruthy();
			const timestamp = match ? Number.parseInt(match[1], 10) : 0;
			expect(timestamp).toBeGreaterThanOrEqual(before);
			expect(timestamp).toBeLessThanOrEqual(after);
		});

		it("sanitizes filenames with special characters", () => {
			const key = getAudioStorageKey("org-789", "my file (1).mp3");
			expect(key).toMatch(
				/^organizations\/org-789\/files\/\d+-my_file__1_\.mp3$/,
			);
		});

		it("preserves safe characters in filename", () => {
			const key = getAudioStorageKey("org-001", "audio-recording_v2.wav");
			expect(key).toMatch(
				/^organizations\/org-001\/files\/\d+-audio-recording_v2\.wav$/,
			);
		});

		it("handles files with multiple dots in name", () => {
			const key = getAudioStorageKey("org-002", "my.meeting.notes.wav");
			expect(key).toMatch(
				/^organizations\/org-002\/files\/\d+-my\.meeting\.notes\.wav$/,
			);
		});

		it("handles UUID organization IDs", () => {
			const orgId = "clz12345-6789-0123-4567-890123456789";
			const key = getAudioStorageKey(orgId, "file.mp3");
			expect(key).toContain(`organizations/${orgId}/files/`);
		});

		it("includes the organizations prefix", () => {
			const key = getAudioStorageKey("org-123", "test.mp3");
			expect(key.startsWith("organizations/")).toBe(true);
		});

		it("includes the organization ID in the key", () => {
			const orgId = "unique-org-id-12345";
			const key = getAudioStorageKey(orgId, "test.mp3");
			expect(key).toContain(orgId);
		});

		it("includes the files directory", () => {
			const key = getAudioStorageKey("org-123", "test.mp3");
			expect(key).toContain("/files/");
		});
	});
});
