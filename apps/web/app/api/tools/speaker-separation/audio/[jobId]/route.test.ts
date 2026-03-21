import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const getToolJobByIdMock = vi.hoisted(() => vi.fn());
const shouldUseSupabaseStorageMock = vi.hoisted(() => vi.fn());
const getDefaultSupabaseProviderMock = vi.hoisted(() => vi.fn());
const configMock = vi.hoisted(() => ({
	storage: { bucketNames: { files: "test-files-bucket" } },
}));

vi.mock("@repo/database", () => ({
	getToolJobById: getToolJobByIdMock,
}));

vi.mock("@repo/storage", () => ({
	shouldUseSupabaseStorage: shouldUseSupabaseStorageMock,
	getDefaultSupabaseProvider: getDefaultSupabaseProviderMock,
}));

vi.mock("@repo/config", () => ({
	config: configMock,
}));

function makeRequest() {
	return new Request(
		"http://localhost/api/tools/speaker-separation/audio/job-1",
	);
}

function makeParams(jobId: string) {
	return { params: Promise.resolve({ jobId }) };
}

describe("GET /api/tools/speaker-separation/audio/[jobId]", () => {
	const mockGetSignedDownloadUrl = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		getDefaultSupabaseProviderMock.mockReturnValue({
			getSignedDownloadUrl: mockGetSignedDownloadUrl,
		});
	});

	it("returns 404 when job is not found", async () => {
		getToolJobByIdMock.mockResolvedValue(null);

		const res = await GET(makeRequest(), makeParams("job-1"));
		const body = await res.json();

		expect(res.status).toBe(404);
		expect(body.error).toBe("Job not found");
	});

	it("returns 404 when job has no audio file", async () => {
		getToolJobByIdMock.mockResolvedValue({
			id: "job-1",
			audioFileUrl: null,
		});

		const res = await GET(makeRequest(), makeParams("job-1"));
		const body = await res.json();

		expect(res.status).toBe(404);
		expect(body.error).toBe("No audio file associated with this job");
	});

	it("returns 500 when Supabase storage is not configured", async () => {
		getToolJobByIdMock.mockResolvedValue({
			id: "job-1",
			audioFileUrl: "storage/path/audio.mp3",
		});
		shouldUseSupabaseStorageMock.mockReturnValue(false);

		const res = await GET(makeRequest(), makeParams("job-1"));
		const body = await res.json();

		expect(res.status).toBe(500);
		expect(body.error).toBe("Storage not configured");
	});

	it("returns signed URL on success", async () => {
		getToolJobByIdMock.mockResolvedValue({
			id: "job-1",
			audioFileUrl: "storage/path/audio.mp3",
		});
		shouldUseSupabaseStorageMock.mockReturnValue(true);
		mockGetSignedDownloadUrl.mockResolvedValue(
			"https://signed.url/audio.mp3",
		);

		const res = await GET(makeRequest(), makeParams("job-1"));
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.url).toBe("https://signed.url/audio.mp3");
		expect(mockGetSignedDownloadUrl).toHaveBeenCalledWith(
			"storage/path/audio.mp3",
			{ bucket: "test-files-bucket", expiresIn: 3600 },
		);
	});

	it("returns 500 when signed URL generation fails", async () => {
		getToolJobByIdMock.mockResolvedValue({
			id: "job-1",
			audioFileUrl: "storage/path/audio.mp3",
		});
		shouldUseSupabaseStorageMock.mockReturnValue(true);
		mockGetSignedDownloadUrl.mockRejectedValue(new Error("Storage error"));

		const res = await GET(makeRequest(), makeParams("job-1"));
		const body = await res.json();

		expect(res.status).toBe(500);
		expect(body.error).toBe("Failed to get audio URL");
	});
});
