import { describe, expect, it, vi } from "vitest";
import { AUDIO_RETENTION_DAYS, getAudioStorageKey } from "./audio-storage";

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
		it("generates correct storage key for mp3 file", () => {
			const key = getAudioStorageKey("job-123", "my-recording.mp3");
			expect(key).toBe("speaker-separation/job-123.mp3");
		});

		it("generates correct storage key for wav file", () => {
			const key = getAudioStorageKey("job-456", "audio.wav");
			expect(key).toBe("speaker-separation/job-456.wav");
		});

		it("generates correct storage key for m4a file", () => {
			const key = getAudioStorageKey("job-789", "voice-memo.m4a");
			expect(key).toBe("speaker-separation/job-789.m4a");
		});

		it("normalizes extension to lowercase", () => {
			const key = getAudioStorageKey("job-001", "recording.MP3");
			expect(key).toBe("speaker-separation/job-001.mp3");
		});

		it("handles files with multiple dots in name", () => {
			const key = getAudioStorageKey("job-002", "my.meeting.notes.wav");
			expect(key).toBe("speaker-separation/job-002.wav");
		});

		it("handles filename with no dot by using entire filename as extension", () => {
			// The implementation uses .pop() which returns the last segment
			// For "noextension", split(".") returns ["noextension"], pop returns "noextension"
			const key = getAudioStorageKey("job-003", "noextension");
			expect(key).toBe("speaker-separation/job-003.noextension");
		});

		it("handles flac extension", () => {
			const key = getAudioStorageKey("job-004", "hifi-audio.flac");
			expect(key).toBe("speaker-separation/job-004.flac");
		});

		it("handles ogg extension", () => {
			const key = getAudioStorageKey("job-005", "podcast.ogg");
			expect(key).toBe("speaker-separation/job-005.ogg");
		});

		it("handles webm extension", () => {
			const key = getAudioStorageKey("job-006", "browser-recording.webm");
			expect(key).toBe("speaker-separation/job-006.webm");
		});

		it("handles UUID job IDs", () => {
			const key = getAudioStorageKey(
				"clz12345678901234567890123",
				"file.mp3",
			);
			expect(key).toBe(
				"speaker-separation/clz12345678901234567890123.mp3",
			);
		});

		it("uses lowercase extension even with mixed case", () => {
			const key = getAudioStorageKey("job-007", "AUDIO.WAV");
			expect(key).toBe("speaker-separation/job-007.wav");
		});

		it("includes the storage prefix", () => {
			const key = getAudioStorageKey("job-123", "test.mp3");
			expect(key.startsWith("speaker-separation/")).toBe(true);
		});

		it("includes the job ID in the key", () => {
			const jobId = "unique-job-id-12345";
			const key = getAudioStorageKey(jobId, "test.mp3");
			expect(key).toContain(jobId);
		});
	});

	describe("AUDIO_RETENTION_DAYS", () => {
		it("is set to 30 days", () => {
			expect(AUDIO_RETENTION_DAYS).toBe(30);
		});

		it("is a positive number", () => {
			expect(AUDIO_RETENTION_DAYS).toBeGreaterThan(0);
		});
	});
});
