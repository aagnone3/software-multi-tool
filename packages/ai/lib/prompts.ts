type PromptSanitizer = (value: string | undefined) => string;

const sanitizeInput: PromptSanitizer = (value) => {
	if (!value) {
		return "";
	}

	return value.replace(/\s+/g, " ").trim();
};

export type PromptListProductNamesOptions = {
	audience?: string;
	count?: number;
	tone?: string;
};

const DEFAULT_PROMPT_COUNT = 5;
const DEFAULT_PROMPT_TONE = "playful";
const DEFAULT_TOPIC = "a new product idea";

export const promptListProductNames = (
	topic: string,
	{
		audience,
		count = DEFAULT_PROMPT_COUNT,
		tone = DEFAULT_PROMPT_TONE,
	}: PromptListProductNamesOptions = {},
): string => {
	const sanitizedTopic = sanitizeInput(topic);
	const sanitizedAudience = sanitizeInput(audience);
	const sanitizedTone = sanitizeInput(tone) || DEFAULT_PROMPT_TONE;
	const finalTopic = sanitizedTopic || DEFAULT_TOPIC;

	const baseInstructions = [
		"You are an AI naming assistant specialising in product branding.",
		`Generate ${count} ${sanitizedTone} product name ideas for ${finalTopic}${sanitizedAudience ? ` that resonate with ${sanitizedAudience}` : ""}.`,
		"Respond with a numbered list where each item is at most three words.",
		"Avoid repeating core keywords and skip explanations.",
	];

	return baseInstructions.join("\n");
};
