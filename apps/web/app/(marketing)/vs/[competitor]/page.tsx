import { StickyCta } from "@marketing/home/components/StickyCta";
import { CompetitorCtaTracker } from "@marketing/shared/components/CompetitorCtaTracker";
import { CompetitorPageTracker } from "@marketing/shared/components/CompetitorPageTracker";
import { config } from "@repo/config";
import { getBaseUrl } from "@repo/utils";
import {
	ArrowRightIcon,
	CheckCircleIcon,
	MinusCircleIcon,
	XCircleIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import React from "react";

const siteUrl = getBaseUrl();

interface ComparisonRow {
	feature: string;
	us: "yes" | "no" | "partial";
	them: "yes" | "no" | "partial";
}

interface CompetitorPage {
	slug: string;
	name: string;
	headline: string;
	description: string;
	ourPitch: string;
	theirPitch: string;
	comparison: ComparisonRow[];
	advantages: string[];
	switchReasons: string[];
}

const competitors: CompetitorPage[] = [
	{
		slug: "otter-ai",
		name: "Otter.ai",
		headline: `${config.appName} vs Otter.ai — More Than Meeting Notes`,
		description: `${config.appName} vs Otter.ai: get AI meeting summaries, speaker diarization, invoice processing, and contract analysis — all in one tool. Otter.ai does notes; we do your entire back office.`,
		ourPitch: "A full AI productivity suite beyond meeting notes",
		theirPitch: "Meeting transcription and note-taking focused",
		comparison: [
			{ feature: "Meeting summarization", us: "yes", them: "yes" },
			{ feature: "Speaker separation", us: "yes", them: "yes" },
			{ feature: "Contract analysis", us: "yes", them: "no" },
			{ feature: "Invoice processing", us: "yes", them: "no" },
			{ feature: "Expense categorization", us: "yes", them: "no" },
			{ feature: "Feedback analysis", us: "yes", them: "no" },
			{ feature: "News analysis", us: "yes", them: "no" },
			{ feature: "Credit-based pricing", us: "yes", them: "no" },
			{ feature: "No per-user seat fees", us: "yes", them: "no" },
			{ feature: "API access", us: "yes", them: "partial" },
		],
		advantages: [
			"8 AI tools in one platform — not just meeting notes",
			"Process contracts, invoices, expenses, and feedback in minutes",
			"Credit-based pricing means you only pay for what you use",
			"No seat fees — great for small teams that share access",
		],
		switchReasons: [
			"You're paying for Otter.ai just for transcription but need document analysis too",
			"You want one AI platform instead of 5 separate subscriptions",
			"You need contract review, not just meeting notes",
			"You're a freelancer or small team tired of per-seat pricing",
		],
	},
	{
		slug: "fireflies-ai",
		name: "Fireflies.ai",
		headline: `${config.appName} vs Fireflies.ai — Beyond Meeting Intelligence`,
		description: `${config.appName} vs Fireflies.ai: beyond meeting intelligence — analyze invoices, contracts, expenses, and customer feedback with AI. One platform for your whole workflow.`,
		ourPitch: "AI tools for every business workflow, not just meetings",
		theirPitch: "Meeting intelligence and CRM integration focused",
		comparison: [
			{ feature: "Meeting summarization", us: "yes", them: "yes" },
			{ feature: "Speaker separation", us: "yes", them: "yes" },
			{ feature: "CRM integrations", us: "partial", them: "yes" },
			{ feature: "Contract analysis", us: "yes", them: "no" },
			{ feature: "Invoice processing", us: "yes", them: "no" },
			{ feature: "Expense categorization", us: "yes", them: "no" },
			{ feature: "Feedback analysis", us: "yes", them: "no" },
			{ feature: "Pay-per-use pricing", us: "yes", them: "no" },
			{ feature: "No bot joining meetings", us: "yes", them: "no" },
		],
		advantages: [
			"No meeting bot required — upload any audio or transcript file",
			"Process expenses and invoices alongside your meeting summaries",
			"Credit-based pricing — no monthly seat minimums",
			"Analyze news, contracts, and feedback all from one dashboard",
		],
		switchReasons: [
			"You don't want a bot joining every meeting",
			"You need more than meeting intelligence — contracts, invoices, expenses",
			"You want flexible pay-as-you-go instead of monthly seat commitments",
			"You're a small team or solo operator who needs multiple AI tools",
		],
	},
	{
		slug: "docparser",
		name: "Docparser",
		headline: `${config.appName} vs Docparser — AI Understanding vs Rule-Based Parsing`,
		description: `${config.appName} vs Docparser: AI invoice processing with no template setup required. Upload any PDF or image and extract vendor, amounts, and line items instantly — no rule configuration.`,
		ourPitch: "AI-powered document understanding without template setup",
		theirPitch: "Template-based document parsing with custom rules",
		comparison: [
			{ feature: "Invoice processing", us: "yes", them: "yes" },
			{ feature: "Zero template setup", us: "yes", them: "no" },
			{ feature: "Natural language output", us: "yes", them: "no" },
			{ feature: "Contract analysis", us: "yes", them: "no" },
			{ feature: "Meeting summarization", us: "yes", them: "no" },
			{ feature: "Expense categorization", us: "yes", them: "no" },
			{
				feature: "Works on any document layout",
				us: "yes",
				them: "partial",
			},
			{ feature: "No training required", us: "yes", them: "no" },
		],
		advantages: [
			"No templates or rules to configure — AI understands any invoice format",
			"Extract structured data from invoices in seconds with no setup",
			"8 AI tools beyond document parsing for complete business automation",
			"Credit-based pricing — no annual contracts or minimums",
		],
		switchReasons: [
			"You're spending hours setting up document parsing templates",
			"Your invoices come in too many different formats for rule-based tools",
			"You want AI that understands context, not just field positions",
			"You need expense categorization and contract review alongside invoice parsing",
		],
	},
	{
		slug: "zapier",
		name: "Zapier",
		headline: `${config.appName} vs Zapier — AI Document Intelligence vs Workflow Automation`,
		description: `${config.appName} vs Zapier: AI-native document intelligence vs workflow glue. Summarize meetings, extract invoices, analyze contracts — without building automations from scratch.`,
		ourPitch:
			"AI-native document analysis and processing for business workflows",
		theirPitch: "No-code workflow automation connecting third-party apps",
		comparison: [
			{ feature: "Invoice data extraction", us: "yes", them: "partial" },
			{ feature: "Contract clause analysis", us: "yes", them: "no" },
			{ feature: "Meeting summarization", us: "yes", them: "no" },
			{ feature: "Speaker separation", us: "yes", them: "no" },
			{ feature: "Expense categorization", us: "yes", them: "no" },
			{ feature: "Feedback analysis", us: "yes", them: "no" },
			{ feature: "Zero API configuration", us: "yes", them: "no" },
			{ feature: "No per-task limits", us: "yes", them: "no" },
			{ feature: "Credit-based pricing", us: "yes", them: "no" },
		],
		advantages: [
			"Purpose-built AI — not a generic automation layer on top of other tools",
			"No API keys, webhooks, or integration setup required",
			"Process any document format immediately — PDF, CSV, audio, text",
			"Credit-based pricing — pay only for what you actually process",
		],
		switchReasons: [
			"You need actual AI document understanding, not just routing data between apps",
			"You're tired of configuring complex multi-step Zaps just to extract invoice data",
			"You want meeting summaries and contract analysis without stitching together 5 tools",
			"You're a small team that doesn't have an ops engineer to maintain Zapier workflows",
		],
	},
	{
		slug: "notion-ai",
		name: "Notion AI",
		headline: `${config.appName} vs Notion AI — Specialized Tools vs All-in-One Workspace`,
		description: `${config.appName} vs Notion AI: purpose-built AI tools for invoices, contracts, meetings, and expenses — vs a general-purpose workspace add-on. Specialized AI beats a feature tag.`,
		ourPitch: "Specialized AI tools for document-heavy business workflows",
		theirPitch: "AI writing and summarization inside a team wiki/notes app",
		comparison: [
			{ feature: "Meeting summarization", us: "yes", them: "yes" },
			{ feature: "Invoice processing", us: "yes", them: "no" },
			{ feature: "Contract analysis", us: "yes", them: "no" },
			{ feature: "Speaker separation", us: "yes", them: "no" },
			{ feature: "Expense categorization", us: "yes", them: "no" },
			{ feature: "Feedback analysis", us: "yes", them: "no" },
			{ feature: "Upload PDF/audio files", us: "yes", them: "partial" },
			{ feature: "Structured JSON output", us: "yes", them: "no" },
			{ feature: "Job history & re-run", us: "yes", them: "no" },
		],
		advantages: [
			"Built for processing documents — not writing or editing them",
			"Handles PDFs, audio recordings, and CSVs that Notion AI can't process well",
			"Structured output every time — not conversational AI writing",
			"Process invoices and contracts that live outside your Notion workspace",
		],
		switchReasons: [
			"You need to process documents that aren't already in Notion",
			"You want structured data extraction from invoices, not AI-written summaries",
			"You need speaker-labeled transcripts from audio recordings",
			"You're doing more document analysis than document writing",
		],
	},
	{
		slug: "adobe-acrobat-ai",
		name: "Adobe Acrobat AI",
		headline: `${config.appName} vs Adobe Acrobat AI — Purpose-Built vs PDF Suite Add-On`,
		description: `${config.appName} vs Adobe Acrobat AI: AI contract review, invoice extraction, and meeting summaries starting free — without a $24/mo Acrobat Pro subscription.`,
		ourPitch:
			"Affordable AI document processing without an Adobe subscription",
		theirPitch: "AI Q&A assistant built into the Adobe Acrobat PDF suite",
		comparison: [
			{ feature: "Contract analysis", us: "yes", them: "partial" },
			{ feature: "Invoice data extraction", us: "yes", them: "partial" },
			{ feature: "Meeting summarization", us: "yes", them: "no" },
			{ feature: "Speaker separation", us: "yes", them: "no" },
			{ feature: "Expense categorization", us: "yes", them: "no" },
			{ feature: "Feedback analysis", us: "yes", them: "no" },
			{ feature: "Structured JSON output", us: "yes", them: "no" },
			{ feature: "Job history & re-run", us: "yes", them: "no" },
			{
				feature: "No Adobe subscription required",
				us: "yes",
				them: "no",
			},
		],
		advantages: [
			"No $30+/month Adobe subscription required",
			"Process audio files, CSV exports, and invoices — not just PDFs",
			"8 specialized AI tools, not a general-purpose PDF Q&A assistant",
			"Structured output for easy copy-paste to spreadsheets or accounting tools",
		],
		switchReasons: [
			"You're paying for Adobe Acrobat mainly to use the AI assistant",
			"You process more than just PDFs — audio, CSV, text files too",
			"You want structured invoice extraction, not a chat interface for PDFs",
			"You need meeting summaries and expense reports alongside contract review",
		],
	},
	{
		slug: "microsoft-copilot",
		name: "Microsoft Copilot",
		headline: `${config.appName} vs Microsoft Copilot — Specialized AI vs Office Add-On`,
		description: `${config.appName} vs Microsoft Copilot: structured AI tools for invoices, contracts, expenses, and meetings — no Microsoft 365 subscription or IT setup required.`,
		ourPitch:
			"Affordable AI tools built for document workflows — no Microsoft 365 required",
		theirPitch: "AI assistant woven into the Microsoft 365 suite",
		comparison: [
			{ feature: "Invoice data extraction", us: "yes", them: "partial" },
			{ feature: "Contract analysis", us: "yes", them: "partial" },
			{ feature: "Meeting summarization", us: "yes", them: "yes" },
			{ feature: "Speaker separation", us: "yes", them: "no" },
			{ feature: "Expense categorization", us: "yes", them: "no" },
			{ feature: "Feedback analysis", us: "yes", them: "no" },
			{ feature: "Structured JSON output", us: "yes", them: "no" },
			{ feature: "Works without Microsoft 365", us: "yes", them: "no" },
			{ feature: "Job history & re-run", us: "yes", them: "no" },
		],
		advantages: [
			"No Microsoft 365 Business subscription required ($22+/user/month)",
			"Structured output designed for downstream use — spreadsheets, accounting tools, APIs",
			"Speaker separation for audio files — Copilot focuses on Teams transcription",
			"8 specialized tools for consistent, repeatable document processing",
		],
		switchReasons: [
			"You want document AI without paying for a full Microsoft 365 seat",
			"You process files outside the Microsoft ecosystem (audio, non-Word docs)",
			"You need structured JSON output, not a summarized chat reply",
			"You want expense and invoice extraction without Excel macros",
		],
	},
	{
		slug: "google-gemini",
		name: "Google Gemini",
		headline: `${config.appName} vs Google Gemini — Purpose-Built Workflows vs General AI`,
		description: `${config.appName} vs Google Gemini: structured, repeatable AI workflows for invoices, contracts, and meeting notes — not a chat interface where you manually prompt everything.`,
		ourPitch:
			"Repeatable AI workflows for business documents — not a chatbot",
		theirPitch: "Google's general-purpose multimodal AI assistant",
		comparison: [
			{ feature: "Meeting summarization", us: "yes", them: "partial" },
			{ feature: "Invoice data extraction", us: "yes", them: "partial" },
			{ feature: "Contract analysis", us: "yes", them: "partial" },
			{ feature: "Speaker separation", us: "yes", them: "no" },
			{ feature: "Expense categorization", us: "yes", them: "no" },
			{ feature: "Structured JSON output", us: "yes", them: "no" },
			{ feature: "Job history & re-run", us: "yes", them: "no" },
			{ feature: "Consistent output schema", us: "yes", them: "no" },
		],
		advantages: [
			"Deterministic structured output — same document format every time",
			"8 purpose-built tools optimized for business document workflows",
			"Full job history so you can re-run any past document without re-uploading",
			"No prompt engineering required — just upload and go",
		],
		switchReasons: [
			"You're tired of copy-pasting invoice data from chat replies into spreadsheets",
			"You need consistent output format across all processed documents",
			"You want a tool that works the same way every run — not a conversational assistant",
			"You process audio, CSV, and PDF files regularly for business workflows",
		],
	},
	{
		slug: "descript",
		name: "Descript",
		headline: `${config.appName} vs Descript — Document Intelligence vs Audio Editing`,
		description: `${config.appName} vs Descript: AI speaker diarization and meeting summaries without the video editing suite. Built for business teams, not content creators.`,
		ourPitch:
			"Meeting summaries and speaker-labeled transcripts — no video editor",
		theirPitch: "Audio and video editor with built-in transcription",
		comparison: [
			{ feature: "Meeting summarization", us: "yes", them: "partial" },
			{ feature: "Speaker separation", us: "yes", them: "yes" },
			{ feature: "Transcript export", us: "yes", them: "yes" },
			{ feature: "Invoice data extraction", us: "yes", them: "no" },
			{ feature: "Contract analysis", us: "yes", them: "no" },
			{ feature: "Expense categorization", us: "yes", them: "no" },
			{ feature: "Structured JSON output", us: "yes", them: "no" },
			{
				feature: "No per-seat fee for batch processing",
				us: "yes",
				them: "no",
			},
		],
		advantages: [
			"8 AI tools beyond audio — invoices, contracts, expenses, feedback",
			"No video editing interface to navigate — built for document workflows",
			"Structured output for meeting summaries ready to paste into your CRM or notes",
			"Process audio files as part of a larger business automation workflow",
		],
		switchReasons: [
			"You use Descript only for transcription, not video editing",
			"You want meeting summaries AND invoice/contract processing in one place",
			"You need structured output instead of a raw transcript",
			"You want to batch process recordings without paying per creator seat",
		],
	},
	{
		slug: "chatgpt",
		name: "ChatGPT",
		headline: `${config.appName} vs ChatGPT — Purpose-Built vs General AI`,
		description: `${config.appName} vs ChatGPT: structured AI workflows for invoices, contracts, and meetings — no prompt engineering, no copy-paste. Just upload and get results.`,
		ourPitch: "Purpose-built AI workflows for business documents",
		theirPitch: "General-purpose AI assistant for any task",
		comparison: [
			{ feature: "Meeting summarization", us: "yes", them: "partial" },
			{
				feature: "Invoice structured extraction",
				us: "yes",
				them: "partial",
			},
			{ feature: "Contract clause analysis", us: "yes", them: "partial" },
			{ feature: "Speaker separation", us: "yes", them: "no" },
			{ feature: "Expense CSV processing", us: "yes", them: "partial" },
			{ feature: "Consistent structured output", us: "yes", them: "no" },
			{ feature: "Job history & re-run", us: "yes", them: "no" },
			{
				feature: "Team sharing & org accounts",
				us: "yes",
				them: "partial",
			},
			{ feature: "Credit-based pricing", us: "yes", them: "no" },
			{ feature: "No prompt engineering needed", us: "yes", them: "no" },
		],
		advantages: [
			"Purpose-built workflows — no prompt engineering needed",
			"Consistent structured output every time (not conversational guessing)",
			"Job history with re-run capability — great for recurring tasks",
			"Processes audio files and PDFs directly — no copy-paste needed",
		],
		switchReasons: [
			"You're tired of crafting prompts to get consistent document output",
			"You want to upload a PDF invoice and get structured JSON — not a chat response",
			"You need job history and the ability to re-run past tasks",
			"You want a workflow built for your business, not a general AI chat window",
		],
	},
	{
		slug: "tldv",
		name: "tl;dv",
		headline: `${config.appName} vs tl;dv — Beyond Meeting Recordings`,
		description: `${config.appName} vs tl;dv: AI meeting summaries plus invoice processing, contract review, and expense categorization — a full back-office AI suite, not just a recorder.`,
		ourPitch:
			"A complete AI productivity suite: meetings, documents, invoices, and more",
		theirPitch: "Meeting recording and highlight clip focused",
		comparison: [
			{ feature: "Meeting summarization", us: "yes", them: "yes" },
			{ feature: "Speaker separation", us: "yes", them: "yes" },
			{ feature: "Highlight clipping", us: "no", them: "yes" },
			{ feature: "Contract analysis", us: "yes", them: "no" },
			{ feature: "Invoice processing", us: "yes", them: "no" },
			{ feature: "Expense categorization", us: "yes", them: "no" },
			{ feature: "Feedback analysis", us: "yes", them: "no" },
			{ feature: "News monitoring", us: "yes", them: "no" },
			{ feature: "Credit-based pricing", us: "yes", them: "no" },
			{ feature: "API access", us: "yes", them: "partial" },
		],
		advantages: [
			"7 specialized AI tools beyond meeting notes",
			"Process documents, invoices, and contracts — not just recordings",
			"Credit-based pricing — pay only for what you use",
			"Job history with re-run for recurring document workflows",
		],
		switchReasons: [
			"You need AI help beyond meeting recordings",
			"You're processing contracts, invoices, or expense reports manually",
			"You want one platform for all document AI tasks",
			"You need structured data output, not just summaries",
		],
	},
	{
		slug: "fathom",
		name: "Fathom",
		headline: `${config.appName} vs Fathom — More Than a Notetaker`,
		description: `${config.appName} vs Fathom: go beyond Zoom summaries — extract invoices, analyze contracts, categorize expenses, and separate speakers. More tools, one subscription.`,
		ourPitch:
			"AI productivity suite for documents, meetings, and business data",
		theirPitch: "AI meeting notetaker for sales and customer calls",
		comparison: [
			{ feature: "Meeting summarization", us: "yes", them: "yes" },
			{ feature: "Speaker identification", us: "yes", them: "yes" },
			{ feature: "CRM integration", us: "no", them: "yes" },
			{ feature: "Contract analysis", us: "yes", them: "no" },
			{ feature: "Invoice processing", us: "yes", them: "no" },
			{ feature: "Expense categorization", us: "yes", them: "no" },
			{ feature: "Feedback analysis", us: "yes", them: "no" },
			{ feature: "News analysis", us: "yes", them: "no" },
			{ feature: "Credit-based pricing", us: "yes", them: "no" },
			{ feature: "Works on non-meeting content", us: "yes", them: "no" },
		],
		advantages: [
			"Handles any audio file, not just recorded calls",
			"Processes documents and invoices alongside meetings",
			"No CRM dependency — works standalone",
			"More flexible tool suite for non-sales teams",
		],
		switchReasons: [
			"You're not primarily a sales team but still need meeting notes",
			"You need AI document processing beyond call summaries",
			"Your team processes invoices, contracts, or expense reports",
			"You prefer pay-as-you-go over per-seat subscription pricing",
		],
	},
	{
		slug: "claude-ai",
		name: "Claude AI",
		headline: `${config.appName} vs Claude AI — Structured Workflows vs Open Chat`,
		description: `${config.appName} vs Claude AI: purpose-built business AI tools with no prompting required. Extract invoices, review contracts, and summarize meetings with one click — powered by the same underlying AI.`,
		ourPitch:
			"Purpose-built workflows for specific business document tasks",
		theirPitch: "General-purpose AI assistant and chat interface",
		comparison: [
			{ feature: "Contract analysis", us: "yes", them: "partial" },
			{ feature: "Invoice data extraction", us: "yes", them: "partial" },
			{ feature: "Meeting summarization", us: "yes", them: "partial" },
			{ feature: "Structured JSON output", us: "yes", them: "partial" },
			{ feature: "File upload processing", us: "yes", them: "yes" },
			{ feature: "Job history & re-run", us: "yes", them: "no" },
			{ feature: "No prompt engineering needed", us: "yes", them: "no" },
			{
				feature: "Consistent repeatable output",
				us: "yes",
				them: "partial",
			},
			{ feature: "Credit-based pay-per-use", us: "yes", them: "no" },
			{ feature: "Audio file transcription", us: "yes", them: "no" },
		],
		advantages: [
			"Zero prompt engineering — just upload and click",
			"Consistent structured output every time",
			"Job history and re-run capability for recurring tasks",
			"Purpose-built for business document workflows",
		],
		switchReasons: [
			"You're tired of re-engineering prompts for the same task every week",
			"You need the same contract extraction logic to run reliably every time",
			"You want to upload an invoice and get structured data — not a conversation",
			"You need job history to track and re-run past documents",
		],
	},
	{
		slug: "loom",
		name: "Loom",
		headline: `${config.appName} vs Loom — Video Messaging vs AI Document Processing`,
		description: `${config.appName} vs Loom: AI that processes your documents and meetings, not just records them. Summarize, extract, and analyze — without watching the playback.`,
		ourPitch:
			"AI toolkit for processing documents, audio, and business data",
		theirPitch: "Async video messaging and screen recording tool",
		comparison: [
			{ feature: "Meeting summarization", us: "yes", them: "partial" },
			{ feature: "Video recording", us: "no", them: "yes" },
			{ feature: "Screen recording", us: "no", them: "yes" },
			{ feature: "AI transcript", us: "yes", them: "yes" },
			{ feature: "Contract analysis", us: "yes", them: "no" },
			{ feature: "Invoice processing", us: "yes", them: "no" },
			{ feature: "Expense categorization", us: "yes", them: "no" },
			{ feature: "News monitoring", us: "yes", them: "no" },
			{ feature: "Feedback analysis", us: "yes", them: "no" },
			{ feature: "Credit-based pricing", us: "yes", them: "no" },
		],
		advantages: [
			"Processes existing audio files — no re-recording needed",
			"Full document automation suite beyond transcription",
			"Handles PDFs, CSVs, and audio without new recordings",
			"Pay-per-use pricing instead of per-seat subscription",
		],
		switchReasons: [
			"You need to process existing audio recordings, not create new ones",
			"You're looking for document AI beyond video messaging",
			"Your use case is contracts, invoices, or expense reports — not team updates",
			"You want usage-based pricing instead of a seat subscription",
		],
	},
	{
		slug: "rev",
		name: "Rev",
		headline: `${config.appName} vs Rev — AI Transcription vs Full Business AI Suite`,
		description: `${config.appName} vs Rev: AI transcription with speaker separation plus invoice processing, contract analysis, and meeting summaries — more tools at a lower per-use cost.`,
		ourPitch:
			"Complete AI toolkit: meetings, documents, expenses, and more",
		theirPitch: "Transcription and captioning service for audio/video",
		comparison: [
			{ feature: "Audio transcription", us: "yes", them: "yes" },
			{ feature: "Speaker separation", us: "yes", them: "yes" },
			{ feature: "Meeting summarization", us: "yes", them: "partial" },
			{ feature: "Contract analysis", us: "yes", them: "no" },
			{ feature: "Invoice processing", us: "yes", them: "no" },
			{ feature: "Expense categorization", us: "yes", them: "no" },
			{ feature: "News monitoring", us: "yes", them: "no" },
			{ feature: "Feedback analysis", us: "yes", them: "no" },
			{ feature: "Credit-based pricing", us: "yes", them: "no" },
			{ feature: "Document automation", us: "yes", them: "no" },
		],
		advantages: [
			"Full business AI suite beyond transcription",
			"Process documents, expenses, and contracts — not just audio",
			"Pay-per-use pricing instead of per-minute charges",
			"One platform for all AI automation needs",
		],
		switchReasons: [
			"You need more than transcription — contracts, invoices, and expenses too",
			"You want predictable credit-based pricing instead of per-minute billing",
			"You're looking to consolidate multiple AI tools into one platform",
			"You need actionable summaries with action items, not just text output",
		],
	},
	{
		slug: "sonix",
		name: "Sonix",
		headline: `${config.appName} vs Sonix — Automated Transcription vs AI Business Suite`,
		description: `${config.appName} vs Sonix: AI transcription and speaker diarization plus a full document intelligence suite. Stop juggling multiple tools for every business workflow.`,
		ourPitch:
			"AI toolkit for documents, audio, expenses, and business data",
		theirPitch: "Automated transcription with editing and translation",
		comparison: [
			{ feature: "Audio transcription", us: "yes", them: "yes" },
			{ feature: "Speaker identification", us: "yes", them: "yes" },
			{ feature: "Translation", us: "no", them: "yes" },
			{ feature: "Meeting summarization", us: "yes", them: "partial" },
			{ feature: "Contract analysis", us: "yes", them: "no" },
			{ feature: "Invoice processing", us: "yes", them: "no" },
			{ feature: "Expense categorization", us: "yes", them: "no" },
			{ feature: "News monitoring", us: "yes", them: "no" },
			{ feature: "Feedback analysis", us: "yes", them: "no" },
			{ feature: "Action item extraction", us: "yes", them: "no" },
		],
		advantages: [
			"Combines transcription with full document automation",
			"Action items and summaries — not just raw text",
			"Handles invoices, contracts, and expenses alongside audio",
			"One subscription instead of paying separately for each tool",
		],
		switchReasons: [
			"You need more than a transcript — summaries and action items matter",
			"You have document workflows beyond audio (invoices, contracts)",
			"You want all AI tools in one place rather than multiple subscriptions",
			"You process mixed workloads — audio files and PDFs in the same day",
		],
	},
	{
		slug: "nanonets",
		name: "Nanonets",
		headline: `${config.appName} vs Nanonets — Document AI vs All-in-One Business AI`,
		description: `${config.appName} vs Nanonets: AI invoice extraction without enterprise pricing or custom model training. Start free, get structured data from any invoice PDF in seconds.`,
		ourPitch:
			"All-in-one AI: meetings, documents, expenses, news, and more",
		theirPitch: "AI document processing and OCR extraction platform",
		comparison: [
			{ feature: "Invoice extraction", us: "yes", them: "yes" },
			{ feature: "Custom model training", us: "no", them: "yes" },
			{ feature: "Meeting summarization", us: "yes", them: "no" },
			{ feature: "Speaker separation", us: "yes", them: "no" },
			{ feature: "Contract analysis", us: "yes", them: "partial" },
			{ feature: "Expense categorization", us: "yes", them: "yes" },
			{ feature: "News monitoring", us: "yes", them: "no" },
			{ feature: "Feedback analysis", us: "yes", them: "no" },
			{ feature: "No-code setup", us: "yes", them: "partial" },
			{ feature: "Credit-based pricing", us: "yes", them: "no" },
		],
		advantages: [
			"Ready-to-use AI with no model training required",
			"Covers audio, text, and document workflows in one tool",
			"Simpler pricing — credits, not enterprise contracts",
			"Meeting and communication tools alongside document AI",
		],
		switchReasons: [
			"You need a ready-to-use solution without training custom models",
			"You have audio workloads (meetings, recordings) alongside documents",
			"You want predictable usage-based pricing without enterprise negotiations",
			"You need news monitoring and feedback analysis beyond document extraction",
		],
	},
	{
		slug: "rossum",
		name: "Rossum",
		headline: `${config.appName} vs Rossum — Enterprise Document AI vs Accessible AI Suite`,
		description: `${config.appName} vs Rossum: AI invoice capture and document processing for SMBs — without enterprise contracts or per-document pricing that punishes growth.`,
		ourPitch: "Accessible AI toolkit for small and mid-size business teams",
		theirPitch: "Enterprise document capture and intelligent automation",
		comparison: [
			{ feature: "Invoice processing", us: "yes", them: "yes" },
			{ feature: "Custom workflows", us: "partial", them: "yes" },
			{ feature: "Meeting summarization", us: "yes", them: "no" },
			{ feature: "Speaker separation", us: "yes", them: "no" },
			{ feature: "Contract analysis", us: "yes", them: "partial" },
			{ feature: "Expense categorization", us: "yes", them: "partial" },
			{ feature: "News monitoring", us: "yes", them: "no" },
			{ feature: "Small business pricing", us: "yes", them: "no" },
			{ feature: "No implementation fee", us: "yes", them: "no" },
			{ feature: "Self-service onboarding", us: "yes", them: "no" },
		],
		advantages: [
			"No implementation fees or long enterprise sales cycles",
			"Self-service onboarding in minutes, not months",
			"Covers audio and communication tools, not just document capture",
			"Credit-based pricing that scales with actual usage",
		],
		switchReasons: [
			"You're a small or mid-size team that doesn't need enterprise complexity",
			"You want to get started immediately without a sales call",
			"You have meeting and audio workflows alongside document processing",
			"You need transparent, usage-based pricing instead of enterprise contracts",
		],
	},
	{
		slug: "bardeen",
		name: "Bardeen",
		headline: `${config.appName} vs Bardeen — Browser Automation vs AI Document Processing`,
		description: `${config.appName} vs Bardeen: AI document processing without browser automation setup. Invoices, contracts, meetings — just upload and get results, no playbook required.`,
		ourPitch:
			"AI toolkit for processing documents, audio, and business data",
		theirPitch: "Browser automation and web scraping for no-code workflows",
		comparison: [
			{ feature: "Browser automation", us: "no", them: "yes" },
			{ feature: "Meeting summarization", us: "yes", them: "no" },
			{ feature: "Invoice processing", us: "yes", them: "no" },
			{ feature: "Contract analysis", us: "yes", them: "no" },
			{ feature: "Speaker separation", us: "yes", them: "no" },
			{ feature: "Expense categorization", us: "yes", them: "no" },
			{ feature: "News monitoring", us: "yes", them: "partial" },
			{ feature: "Feedback analysis", us: "yes", them: "no" },
			{ feature: "Document AI", us: "yes", them: "no" },
			{ feature: "Credit-based pricing", us: "yes", them: "no" },
		],
		advantages: [
			"Purpose-built for AI document and audio processing tasks",
			"No browser required — works on files and data directly",
			"Specialized AI models for each business document type",
			"Handles PDFs, audio, and CSVs without browser scripting",
		],
		switchReasons: [
			"You need to process documents and audio files, not automate browsers",
			"You want specialized AI for invoices, contracts, and meetings",
			"Your automation needs are file-centric, not web-centric",
			"You prefer purpose-built tools over general web automation",
		],
	},
	{
		slug: "make",
		name: "Make (Integromat)",
		headline: `${config.appName} vs Make — Workflow Automation vs Specialized AI Processing`,
		description: `${config.appName} vs Make (Integromat): AI-native document intelligence without scenario builders. Extract, summarize, and analyze — no workflow diagrams needed.`,
		ourPitch: "Purpose-built AI for documents, meetings, and business data",
		theirPitch:
			"Visual workflow automation platform connecting apps and APIs",
		comparison: [
			{ feature: "Visual workflow builder", us: "no", them: "yes" },
			{ feature: "App integrations (1000+)", us: "partial", them: "yes" },
			{ feature: "Meeting summarization", us: "yes", them: "partial" },
			{ feature: "Invoice processing", us: "yes", them: "partial" },
			{ feature: "Contract analysis", us: "yes", them: "no" },
			{ feature: "Speaker separation", us: "yes", them: "no" },
			{ feature: "Expense categorization", us: "yes", them: "no" },
			{ feature: "Built-in AI models", us: "yes", them: "partial" },
			{ feature: "No-config document AI", us: "yes", them: "no" },
			{ feature: "Credit-based pricing", us: "yes", them: "no" },
		],
		advantages: [
			"Zero configuration — AI models work out of the box",
			"Specialized models trained for each document type",
			"No workflow building required for common business tasks",
			"Handles complex PDFs and audio without custom scenarios",
		],
		switchReasons: [
			"You want AI that works immediately without building custom workflows",
			"You need specialized document AI rather than generic API calls",
			"Your team processes invoices, contracts, or meetings daily",
			"You prefer purpose-built tools over assembling your own AI stack",
		],
	},
	{
		slug: "assemblyai",
		name: "AssemblyAI",
		headline: `${config.appName} vs AssemblyAI — Business Tools, Not Just an API`,
		description: `${config.appName} vs AssemblyAI: business-ready AI transcription and speaker diarization without API integration. Upload audio and get summaries — no developer required.`,
		ourPitch: "A complete AI productivity suite with no code required",
		theirPitch:
			"Developer-focused transcription and audio intelligence API",
		comparison: [
			{ feature: "Meeting summarization", us: "yes", them: "yes" },
			{ feature: "Speaker separation", us: "yes", them: "yes" },
			{ feature: "No-code interface", us: "yes", them: "no" },
			{ feature: "Contract analysis", us: "yes", them: "no" },
			{ feature: "Invoice processing", us: "yes", them: "no" },
			{ feature: "Expense categorization", us: "yes", them: "no" },
			{ feature: "Feedback analysis", us: "yes", them: "no" },
			{ feature: "Credit-based pricing", us: "yes", them: "no" },
			{ feature: "Built for business users", us: "yes", them: "no" },
			{ feature: "API access", us: "yes", them: "yes" },
		],
		advantages: [
			"No code required — business users can use tools directly",
			"8 AI tools beyond transcription in one platform",
			"Credit-based pricing — pay only for what you use",
			"Purpose-built for business workflows, not developers",
		],
		switchReasons: [
			"You're a business user who wants tools, not APIs to build on",
			"You need contract and invoice AI alongside transcription",
			"You want one subscription instead of building your own tool stack",
			"You want predictable per-use pricing without API overhead",
		],
	},
	{
		slug: "deepgram",
		name: "Deepgram",
		headline: `${config.appName} vs Deepgram — Beyond Fast Transcription`,
		description: `${config.appName} vs Deepgram: real-time AI transcription for business teams without API setup. Speaker separation, meeting summaries, and document workflows — all in one UI.`,
		ourPitch:
			"Complete business AI tools, not just transcription infrastructure",
		theirPitch: "High-speed audio transcription API for developers",
		comparison: [
			{ feature: "Audio transcription", us: "yes", them: "yes" },
			{ feature: "Speaker diarization", us: "yes", them: "yes" },
			{ feature: "No-code interface", us: "yes", them: "no" },
			{ feature: "Meeting summaries", us: "yes", them: "no" },
			{ feature: "Contract analysis", us: "yes", them: "no" },
			{ feature: "Invoice processing", us: "yes", them: "no" },
			{ feature: "Expense categorization", us: "yes", them: "no" },
			{ feature: "News analysis", us: "yes", them: "no" },
			{ feature: "Credit-based pricing", us: "yes", them: "no" },
			{ feature: "Built for non-developers", us: "yes", them: "no" },
		],
		advantages: [
			"Complete AI workflow tools, not just a transcription API",
			"No code or infrastructure required",
			"Process documents and meetings in one platform",
			"Credit-based pricing that scales with actual use",
		],
		switchReasons: [
			"You need business tools, not developer infrastructure",
			"You want more than fast transcription — you need insights",
			"You're tired of building plumbing just to use AI",
			"You want invoice, contract, and feedback AI alongside transcription",
		],
	},
	{
		slug: "hyper-ai",
		name: "Hyper AI",
		headline: `${config.appName} vs Hyper — Purpose-Built Business AI`,
		description: `${config.appName} vs Hyper AI: AI business tools with broader document coverage — invoices, contracts, feedback, expenses, and meetings — with no per-seat pricing.`,
		ourPitch: "Specialized AI tools for 8 core business workflows",
		theirPitch: "General-purpose AI assistant for workplace tasks",
		comparison: [
			{ feature: "Meeting summarization", us: "yes", them: "yes" },
			{ feature: "Contract analysis", us: "yes", them: "partial" },
			{ feature: "Invoice processing", us: "yes", them: "partial" },
			{ feature: "Expense categorization", us: "yes", them: "no" },
			{ feature: "Speaker separation", us: "yes", them: "no" },
			{ feature: "Feedback analysis", us: "yes", them: "no" },
			{ feature: "News analysis", us: "yes", them: "no" },
			{ feature: "Credit-based pricing", us: "yes", them: "no" },
			{ feature: "Job history & output storage", us: "yes", them: "no" },
			{ feature: "API access", us: "yes", them: "partial" },
		],
		advantages: [
			"8 specialized tools built for specific business workflows",
			"Full job history and output review",
			"Credit-based pricing — pay per use, not per seat",
			"Deeper accuracy on specialized tasks (invoices, contracts, expenses)",
		],
		switchReasons: [
			"You want specialized accuracy, not a general-purpose assistant",
			"You need to process invoices and contracts reliably at volume",
			"You want to see and re-run your full AI job history",
			"You prefer per-use pricing to monthly seat fees",
		],
	},
	{
		slug: "grain",
		name: "Grain",
		headline: `${config.appName} vs Grain — More Than Meeting Highlights`,
		description: `${config.appName} vs Grain: AI meeting summaries and highlights plus invoice processing, contract review, and speaker diarization. Don't pay two tools when one does more.`,
		ourPitch: "A full AI business tool suite beyond meeting clips",
		theirPitch: "Meeting recording and highlight clip sharing",
		comparison: [
			{ feature: "Meeting summarization", us: "yes", them: "yes" },
			{ feature: "Speaker identification", us: "yes", them: "yes" },
			{ feature: "Meeting highlight clips", us: "no", them: "yes" },
			{ feature: "Contract analysis", us: "yes", them: "no" },
			{ feature: "Invoice processing", us: "yes", them: "no" },
			{ feature: "Expense categorization", us: "yes", them: "no" },
			{ feature: "Feedback analysis", us: "yes", them: "no" },
			{ feature: "News analysis", us: "yes", them: "no" },
			{ feature: "Credit-based pricing", us: "yes", them: "no" },
			{ feature: "Document AI tools", us: "yes", them: "no" },
		],
		advantages: [
			"8 AI tools for the full business workflow, not just meetings",
			"Process contracts, invoices, and expenses alongside meeting notes",
			"Credit-based pricing — no seat fees for occasional users",
			"One platform instead of meeting-notes + document AI separately",
		],
		switchReasons: [
			"You need document AI alongside meeting intelligence",
			"You pay for Grain but also pay for contract/invoice tools separately",
			"You want one AI platform for all your business documents",
			"Your team rarely needs highlight clips but needs better summaries",
		],
	},
	{
		slug: "abbyy",
		name: "ABBYY",
		headline: `${config.appName} vs ABBYY — Modern AI Without the Enterprise Price Tag`,
		description: `${config.appName} vs ABBYY: AI invoice extraction and document processing for SMBs — without ABBYY's enterprise pricing, OCR engine setup, or IT procurement cycle.`,
		ourPitch: "Modern AI document tools with simple credit-based pricing",
		theirPitch: "Enterprise intelligent document processing platform",
		comparison: [
			{ feature: "Invoice data extraction", us: "yes", them: "yes" },
			{ feature: "Contract analysis", us: "yes", them: "partial" },
			{ feature: "Meeting summarization", us: "yes", them: "no" },
			{ feature: "Expense categorization", us: "yes", them: "partial" },
			{ feature: "Feedback analysis", us: "yes", them: "no" },
			{ feature: "News analysis", us: "yes", them: "no" },
			{ feature: "Credit-based pricing", us: "yes", them: "no" },
			{
				feature: "No enterprise contract required",
				us: "yes",
				them: "no",
			},
			{ feature: "Easy setup (no IT required)", us: "yes", them: "no" },
			{ feature: "API access", us: "yes", them: "yes" },
		],
		advantages: [
			"Start in minutes without an enterprise procurement process",
			"Credit-based pricing — no $10k+ annual contracts",
			"Modern LLM-powered accuracy without legacy OCR limitations",
			"Meeting and feedback AI alongside document processing",
		],
		switchReasons: [
			"ABBYY requires enterprise pricing that doesn't fit your budget",
			"You want modern LLM accuracy without legacy OCR complexity",
			"Your team needs meeting AI alongside document extraction",
			"You want to be up and running in hours, not months",
		],
	},
	{
		slug: "aws-textract",
		name: "AWS Textract",
		headline: `${config.appName} vs AWS Textract — Business-Ready AI Without the Cloud Complexity`,
		description: `${config.appName} vs AWS Textract: AI invoice and document extraction with no AWS account, IAM setup, or per-page pricing. Upload a PDF, get structured data — that's it.`,
		ourPitch: "Business-ready AI tools with zero infrastructure overhead",
		theirPitch: "Developer-focused OCR and document extraction API",
		comparison: [
			{ feature: "Invoice processing", us: "yes", them: "partial" },
			{ feature: "No AWS account required", us: "yes", them: "no" },
			{ feature: "Non-developer usage", us: "yes", them: "no" },
			{ feature: "Meeting summarization", us: "yes", them: "no" },
			{ feature: "Speaker separation", us: "yes", them: "no" },
			{ feature: "Contract analysis", us: "yes", them: "no" },
			{ feature: "Credit-based pricing", us: "yes", them: "no" },
			{ feature: "Setup in minutes", us: "yes", them: "no" },
		],
		advantages: [
			"No AWS account, IAM roles, or infrastructure setup required",
			"Works out of the box for non-technical business users",
			"Full AI workflow suite — not just document OCR",
			"Predictable credit-based pricing vs AWS consumption billing",
		],
		switchReasons: [
			"AWS Textract requires developer resources to integrate and maintain",
			"You need business AI tools, not raw API endpoints",
			"AWS billing complexity doesn't fit your team's budget process",
			"You want meeting and feedback AI alongside document tools",
		],
	},
	{
		slug: "azure-ai-document",
		name: "Azure AI Document Intelligence",
		headline: `${config.appName} vs Azure AI Document Intelligence — AI for Business Teams`,
		description: `${config.appName} vs Azure AI Document Intelligence: invoice extraction, contract review, and meeting summaries in a ready-to-use UI — no Azure subscription or SDK integration.`,
		ourPitch: "A complete AI productivity suite for business teams",
		theirPitch: "Enterprise document processing API from Microsoft",
		comparison: [
			{ feature: "Invoice data extraction", us: "yes", them: "yes" },
			{ feature: "Non-developer setup", us: "yes", them: "no" },
			{ feature: "Meeting summarization", us: "yes", them: "no" },
			{ feature: "Contract analysis", us: "yes", them: "no" },
			{ feature: "Speaker separation", us: "yes", them: "no" },
			{ feature: "No Azure subscription needed", us: "yes", them: "no" },
			{ feature: "Credit-based pricing", us: "yes", them: "no" },
			{ feature: "Setup in under 5 minutes", us: "yes", them: "no" },
		],
		advantages: [
			"No Azure subscription or IT procurement process required",
			"Full productivity suite — not just document intelligence",
			"Business-user-friendly interface without API knowledge",
			"Simple credit pricing vs Azure consumption billing complexity",
		],
		switchReasons: [
			"Azure AI requires IT involvement and enterprise licensing",
			"You need a broader AI toolkit beyond document extraction",
			"Azure billing and compliance overhead doesn't fit your team",
			"You want to be productive in minutes, not weeks",
		],
	},
	{
		slug: "eightfold-ai",
		name: "Eightfold AI",
		headline: `${config.appName} vs Eightfold AI — Practical AI Tools for Every Business`,
		description: `${config.appName} vs Eightfold AI: general-purpose AI document tools vs HR-focused AI. For invoices, contracts, meetings, and expense analysis — ${config.appName} covers the full back office.`,
		ourPitch: "Practical AI tools for any business team",
		theirPitch: "Enterprise talent intelligence platform",
		comparison: [
			{ feature: "Document analysis", us: "yes", them: "partial" },
			{ feature: "Invoice processing", us: "yes", them: "no" },
			{ feature: "Meeting summarization", us: "yes", them: "no" },
			{ feature: "Non-HR use cases", us: "yes", them: "no" },
			{ feature: "Credit-based pricing", us: "yes", them: "no" },
			{ feature: "SMB-friendly pricing", us: "yes", them: "no" },
			{ feature: "Setup in minutes", us: "yes", them: "no" },
			{ feature: "No procurement needed", us: "yes", them: "no" },
		],
		advantages: [
			"Works across all business functions, not just HR",
			"No enterprise procurement or six-figure contract required",
			"Full AI suite covering meetings, documents, and analysis",
			"Predictable credit-based pricing with free tier",
		],
		switchReasons: [
			"Eightfold is HR-specific and requires enterprise contracts",
			"You need AI tools beyond talent management",
			"Enterprise pricing doesn't fit SMB budgets",
			"You want immediate productivity gains without a long sales cycle",
		],
	},
	{
		slug: "kofax",
		name: "Kofax",
		headline: `${config.appName} vs Kofax — Modern AI Without Legacy Complexity`,
		description: `${config.appName} vs Kofax: AI invoice processing and document capture for SMBs — at a fraction of the cost, with no implementation project or dedicated IT team required.`,
		ourPitch: "Modern LLM-powered AI for business teams",
		theirPitch:
			"Legacy enterprise document capture and automation platform",
		comparison: [
			{ feature: "Invoice processing", us: "yes", them: "yes" },
			{ feature: "Modern LLM accuracy", us: "yes", them: "no" },
			{ feature: "Meeting summarization", us: "yes", them: "no" },
			{ feature: "SMB-friendly pricing", us: "yes", them: "no" },
			{ feature: "Setup in minutes", us: "yes", them: "no" },
			{
				feature: "No on-premise option needed",
				us: "yes",
				them: "partial",
			},
			{ feature: "Credit-based pricing", us: "yes", them: "no" },
			{ feature: "Non-technical user access", us: "yes", them: "no" },
		],
		advantages: [
			"Modern LLM accuracy vs legacy OCR rule-based engines",
			"No enterprise licensing, consultants, or implementation projects",
			"Full AI suite covering meetings and analysis alongside documents",
			"Predictable per-use pricing vs Kofax's complex licensing model",
		],
		switchReasons: [
			"Kofax requires expensive implementation and licensing",
			"You want modern AI accuracy without legacy OCR limitations",
			"Your team needs meeting AI alongside document tools",
			"You want to be up and running without a consultant",
		],
	},
	{
		slug: "docsumo",
		name: "Docsumo",
		headline: `${config.appName} vs Docsumo — Beyond Document Extraction`,
		description: `${config.appName} vs Docsumo: AI invoice data extraction with a broader toolset — contracts, meetings, expenses, and feedback — at SMB-friendly per-credit pricing.`,
		ourPitch: "A full AI productivity suite, not just document parsing",
		theirPitch: "Document data extraction and classification platform",
		comparison: [
			{ feature: "Invoice data extraction", us: "yes", them: "yes" },
			{ feature: "Contract analysis", us: "yes", them: "no" },
			{ feature: "Meeting summarization", us: "yes", them: "no" },
			{ feature: "Expense categorization", us: "yes", them: "no" },
			{ feature: "Feedback analysis", us: "yes", them: "no" },
			{ feature: "News analysis", us: "yes", them: "no" },
			{ feature: "Credit-based pricing", us: "yes", them: "no" },
			{
				feature: "No workflow builder required",
				us: "yes",
				them: "partial",
			},
		],
		advantages: [
			"Full business AI suite beyond document extraction",
			"Meeting and contract tools alongside invoice processing",
			"No template training required — LLM-powered extraction",
			"Transparent per-use pricing without enterprise contracts",
		],
		switchReasons: [
			"Docsumo requires template setup and training per document type",
			"You need meeting summaries alongside document tools",
			"You want a single platform for all AI business tasks",
			"You want predictable per-use pricing without custom contracts",
		],
	},
	{
		slug: "sensible",
		name: "Sensible",
		headline: `${config.appName} vs Sensible — AI Without the Config Tax`,
		description: `${config.appName} vs Sensible: AI document extraction with no JSON schema configuration or developer setup. Upload an invoice or contract and get structured results immediately.`,
		ourPitch:
			"Ready-to-use AI tools for business teams without technical setup",
		theirPitch: "Developer-focused document extraction with custom configs",
		comparison: [
			{ feature: "Invoice extraction", us: "yes", them: "yes" },
			{ feature: "No developer required", us: "yes", them: "no" },
			{ feature: "Contract analysis", us: "yes", them: "partial" },
			{ feature: "Meeting summarization", us: "yes", them: "no" },
			{ feature: "Expense categorization", us: "yes", them: "no" },
			{ feature: "Business user friendly", us: "yes", them: "no" },
			{ feature: "Feedback analysis", us: "yes", them: "no" },
			{ feature: "News analysis", us: "yes", them: "no" },
		],
		advantages: [
			"No developer needed — business teams use it directly",
			"Full AI productivity suite beyond document parsing",
			"LLM-powered extraction without JSON config files",
			"Meeting and feedback tools alongside document AI",
		],
		switchReasons: [
			"Sensible requires developer-written extraction configs",
			"Your team needs AI tools beyond document extraction",
			"You want business users to self-serve without engineering support",
			"You want meeting and feedback tools alongside document processing",
		],
	},
	{
		slug: "hyperscience",
		name: "HyperScience",
		headline: `${config.appName} vs HyperScience — Enterprise Power Without Enterprise Price`,
		description: `${config.appName} vs HyperScience: intelligent document processing for SMBs — without enterprise contracts, custom model training, or multi-month implementations.`,
		ourPitch: "Modern LLM-powered AI for growing teams",
		theirPitch: "Enterprise intelligent document processing and automation",
		comparison: [
			{ feature: "Invoice processing", us: "yes", them: "yes" },
			{ feature: "Modern LLM accuracy", us: "yes", them: "partial" },
			{ feature: "Meeting summarization", us: "yes", them: "no" },
			{ feature: "SMB-friendly pricing", us: "yes", them: "no" },
			{ feature: "Setup without IT", us: "yes", them: "no" },
			{ feature: "Contract analysis", us: "yes", them: "partial" },
			{ feature: "Credit-based pricing", us: "yes", them: "no" },
			{
				feature: "No implementation project needed",
				us: "yes",
				them: "no",
			},
		],
		advantages: [
			"Modern LLM accuracy without enterprise implementation costs",
			"No IT project, consultants, or onboarding required",
			"Meeting summarization and feedback analysis alongside documents",
			"Per-use pricing that scales with actual usage",
		],
		switchReasons: [
			"HyperScience requires enterprise contracts and implementation projects",
			"You need meeting AI and feedback tools alongside documents",
			"You want modern LLM accuracy without legacy ML pipelines",
			"You want to start in days, not months",
		],
	},
	{
		slug: "instabase",
		name: "Instabase",
		headline: `${config.appName} vs Instabase — AI Automation That's Actually Accessible`,
		description: `${config.appName} vs Instabase: AI document understanding for small and mid-size businesses — start free without a sales call, data-center deployment, or platform fee.`,
		ourPitch: "Ready-to-use AI tools without platform engineering",
		theirPitch: "Enterprise document understanding and automation platform",
		comparison: [
			{ feature: "Invoice processing", us: "yes", them: "yes" },
			{ feature: "Meeting summarization", us: "yes", them: "no" },
			{ feature: "Contract analysis", us: "yes", them: "partial" },
			{ feature: "No custom model training", us: "yes", them: "no" },
			{ feature: "Expense categorization", us: "yes", them: "no" },
			{ feature: "Feedback analysis", us: "yes", them: "no" },
			{ feature: "Credit-based pricing", us: "yes", them: "no" },
			{ feature: "Setup without engineers", us: "yes", them: "no" },
		],
		advantages: [
			"Ready-to-use tools for business teams without ML engineering",
			"Meeting, feedback, and news tools alongside document processing",
			"Transparent per-use pricing without enterprise licensing",
			"Modern LLM accuracy without custom model training",
		],
		switchReasons: [
			"Instabase requires ML platform engineering to get value",
			"You need meeting summarization and feedback analysis",
			"You want predictable usage-based pricing",
			"Your team needs AI tools they can use without IT involvement",
		],
	},
];

function Icon({ value }: { value: "yes" | "no" | "partial" }) {
	if (value === "yes") {
		return <CheckCircleIcon className="size-5 text-green-500" />;
	}
	if (value === "no") {
		return <XCircleIcon className="size-5 text-red-400" />;
	}
	return <MinusCircleIcon className="size-5 text-yellow-500" />;
}

export async function generateStaticParams() {
	return competitors.map((c) => ({ competitor: c.slug }));
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ competitor: string }>;
}): Promise<Metadata> {
	const { competitor } = await params;
	const page = competitors.find((c) => c.slug === competitor);
	if (!page) {
		return {};
	}
	return {
		title: `${page.headline}`,
		description: page.description,
		alternates: { canonical: `${siteUrl}/vs/${page.slug}` },
		openGraph: {
			type: "website",
			url: `${siteUrl}/vs/${page.slug}`,
			title: page.headline,
			description: page.description,
			images: [
				{
					url: `${siteUrl}/api/og?title=${encodeURIComponent(page.headline)}&description=${encodeURIComponent(page.description)}`,
					width: 1200,
					height: 630,
					alt: page.headline,
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			title: page.headline,
			description: page.description,
		},
	};
}

export default async function CompetitorPage({
	params,
}: {
	params: Promise<{ competitor: string }>;
}) {
	const { competitor } = await params;
	const page = competitors.find((c) => c.slug === competitor);
	if (!page) {
		notFound();
	}

	const breadcrumbJsonLd = {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: [
			{ "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
			{
				"@type": "ListItem",
				position: 2,
				name: "Comparisons",
				item: `${siteUrl}/vs`,
			},
			{
				"@type": "ListItem",
				position: 3,
				name: `vs ${page.name}`,
				item: `${siteUrl}/vs/${page.slug}`,
			},
		],
	};

	const faqJsonLd = {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		mainEntity: [
			{
				"@type": "Question",
				name: `Why switch from ${page.name} to ${config.appName}?`,
				acceptedAnswer: {
					"@type": "Answer",
					text: page.switchReasons.join(" "),
				},
			},
			{
				"@type": "Question",
				name: `How does ${config.appName} compare to ${page.name}?`,
				acceptedAnswer: {
					"@type": "Answer",
					text: page.advantages.join(" "),
				},
			},
		],
	};

	return (
		<>
			<CompetitorPageTracker
				competitorSlug={page.slug}
				competitorName={page.name}
			/>
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(breadcrumbJsonLd),
				}}
			/>
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(faqJsonLd),
				}}
			/>

			{/* Hero */}
			<section className="bg-gradient-to-b from-primary/5 to-background py-20 md:py-28">
				<div className="container mx-auto max-w-4xl px-4 text-center">
					<p className="mb-4 font-semibold text-primary text-sm uppercase tracking-wider">
						Comparison
					</p>
					<h1 className="font-bold text-4xl leading-tight md:text-5xl">
						{config.appName} vs {page.name}
					</h1>
					<p className="mx-auto mt-6 max-w-2xl text-foreground/60 text-lg">
						{page.description}
					</p>
					<div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
						<CompetitorCtaTracker
							competitorSlug={page.slug}
							ctaType="signup"
							position="hero"
						>
							<Link
								href="/auth/signup"
								className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:opacity-90"
							>
								Try {config.appName} Free
								<ArrowRightIcon className="size-4" />
							</Link>
						</CompetitorCtaTracker>
						<CompetitorCtaTracker
							competitorSlug={page.slug}
							ctaType="pricing"
							position="hero"
						>
							<Link
								href="/pricing"
								className="inline-flex items-center rounded-lg border border-border px-6 py-3 font-semibold transition hover:bg-accent"
							>
								See Pricing
							</Link>
						</CompetitorCtaTracker>
					</div>
				</div>
			</section>

			{/* One-line pitches */}
			<section className="border-b border-border bg-muted/30 py-10">
				<div className="container mx-auto max-w-4xl px-4">
					<div className="grid gap-8 sm:grid-cols-2">
						<div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
							<p className="mb-1 font-semibold text-primary text-sm uppercase tracking-wider">
								{config.appName}
							</p>
							<p className="text-foreground/80">
								{page.ourPitch}
							</p>
						</div>
						<div className="rounded-xl border border-border bg-background p-6">
							<p className="mb-1 font-semibold text-sm text-foreground/50 uppercase tracking-wider">
								{page.name}
							</p>
							<p className="text-foreground/60">
								{page.theirPitch}
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Feature comparison table */}
			<section className="py-16">
				<div className="container mx-auto max-w-4xl px-4">
					<h2 className="mb-8 text-center font-bold text-2xl md:text-3xl">
						Feature Comparison
					</h2>
					<div className="overflow-hidden rounded-xl border border-border">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-border bg-muted/50">
									<th className="px-6 py-4 text-left font-semibold">
										Feature
									</th>
									<th className="px-6 py-4 text-center font-semibold text-primary">
										{config.appName}
									</th>
									<th className="px-6 py-4 text-center font-semibold text-foreground/50">
										{page.name}
									</th>
								</tr>
							</thead>
							<tbody>
								{page.comparison.map((row, i) => (
									<tr
										key={row.feature}
										className={`border-b border-border last:border-0 ${i % 2 === 0 ? "bg-background" : "bg-muted/20"}`}
									>
										<td className="px-6 py-3 font-medium">
											{row.feature}
										</td>
										<td className="px-6 py-3 text-center">
											<div className="flex justify-center">
												<Icon value={row.us} />
											</div>
										</td>
										<td className="px-6 py-3 text-center">
											<div className="flex justify-center">
												<Icon value={row.them} />
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<p className="mt-3 text-center text-foreground/40 text-xs">
						✅ Yes &nbsp;|&nbsp; ❌ No &nbsp;|&nbsp; 🟡 Partial
					</p>
				</div>
			</section>

			{/* Why switch */}
			<section className="bg-muted/30 py-16">
				<div className="container mx-auto max-w-4xl px-4">
					<h2 className="mb-8 text-center font-bold text-2xl md:text-3xl">
						Why teams switch from {page.name} to {config.appName}
					</h2>
					<div className="grid gap-4 sm:grid-cols-2">
						{page.switchReasons.map((reason) => (
							<div
								key={reason}
								className="flex items-start gap-3 rounded-lg border border-border bg-background p-4"
							>
								<CheckCircleIcon className="mt-0.5 size-5 shrink-0 text-primary" />
								<p className="text-foreground/80 text-sm">
									{reason}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Our advantages */}
			<section className="py-16">
				<div className="container mx-auto max-w-4xl px-4">
					<h2 className="mb-8 text-center font-bold text-2xl md:text-3xl">
						What you get with {config.appName}
					</h2>
					<ul className="mx-auto max-w-2xl space-y-4">
						{page.advantages.map((adv) => (
							<li key={adv} className="flex items-start gap-3">
								<CheckCircleIcon className="mt-0.5 size-5 shrink-0 text-green-500" />
								<span className="text-foreground/80">
									{adv}
								</span>
							</li>
						))}
					</ul>
				</div>
			</section>

			{/* CTA */}
			<section className="border-t border-border bg-primary/5 py-20">
				<div className="container mx-auto max-w-3xl px-4 text-center">
					<h2 className="font-bold text-3xl md:text-4xl">
						Ready to switch from {page.name}?
					</h2>
					<p className="mx-auto mt-4 max-w-xl text-foreground/60 text-lg">
						Try {config.appName} free. No credit card required.
					</p>
					<div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
						<CompetitorCtaTracker
							competitorSlug={page.slug}
							ctaType="signup"
							position="footer"
						>
							<Link
								href="/auth/signup"
								className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 font-semibold text-primary-foreground transition hover:opacity-90"
							>
								Start Free — No Credit Card
								<ArrowRightIcon className="size-4" />
							</Link>
						</CompetitorCtaTracker>
						<CompetitorCtaTracker
							competitorSlug={page.slug}
							ctaType="pricing"
							position="footer"
						>
							<Link
								href="/pricing"
								className="text-foreground/60 text-sm underline underline-offset-4 hover:text-foreground"
							>
								Compare plans →
							</Link>
						</CompetitorCtaTracker>
					</div>
				</div>
			</section>

			<StickyCta />
		</>
	);
}
