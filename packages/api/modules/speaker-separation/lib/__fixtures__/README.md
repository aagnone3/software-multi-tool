# Speaker Separation Test Fixtures

This directory contains audio files for integration testing the speaker separation processor.

## Required Fixtures

| File                     | Description                                      |
| ------------------------ | ------------------------------------------------ |
| `IB4001.Mix-Headset.wav` | Multi-speaker audio file for diarization testing |

## Setup

Audio fixtures are excluded from git due to their size. To run integration tests:

1. Place your test audio file in this directory
2. Name it `IB4001.Mix-Headset.wav` (or update the test to use your filename)
3. Ensure `ASSEMBLYAI_API_KEY` is set in `apps/web/.env.local`

Tests will automatically skip if the fixture file is missing.

## Format Requirements

- Supported formats: WAV, MP3, M4A, FLAC, OGG, WebM
- Contains speech from 2+ speakers for meaningful diarization results
- Duration: Any length works, but shorter files reduce API costs (~$0.015/minute)
