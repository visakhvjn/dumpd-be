import { openai } from '../config/openai.js';

export const createEmbedding = async (text) => {
	const response = await openai.embeddings.create({
		model: 'text-embedding-3-small',
		input: text,
	});

	return response.data[0].embedding;
};

export const summarizeQuery = async (query, chunks) => {
	const prompt = `
		Summarize the following query and provide a concise response based on the provided chunks of text.

		Query: ${query}
		Chunks: ${chunks
			.map((chunk, index) => `Chunk ${index + 1}: ${chunk}`)
			.join('\n')}

		If the chunks are not relevant to the query, respond with "No relevant information found." Otherwise, provide a summary based on the chunks.
		The output should be a string with the summary.
		Keep the summary concise and focused on the query.
		Make sure to include only the most relevant information from the chunks.
		Respond with the summary in a single paragraph without any additional explanations.
		Make sure it is clear and easy to understand.
		Make sure it doesn't exceed 50 words.
	`;

	const response = await openai.chat.completions.create({
		model: 'gpt-3.5-turbo',
		messages: [
			{
				role: 'system',
				content: 'You are a professional content summarizer.',
			},
			{
				role: 'user',
				content: prompt,
			},
		],
	});

	return response.choices[0].message.content.trim();
};

export const generateImagePrompt = async (content) => {
	const prompt = `
        Summarise the following content into a concise and descriptive prompt for AI image generation.
		The prompt should be clear, vivid, and suitable for generating an image that captures the essence of the content.
		Avoid technical jargon and focus on descriptive language that evokes imagery.
		Make sure the prompt is engaging and suitable for an AI image generator.
		Keep the prompt concise, ideally under 10 words.


        Content: ${content}
    `;

	const response = await openai.chat.completions.create({
		model: 'gpt-3.5-turbo',
		messages: [
			{
				role: 'system',
				content:
					'You are an expert in prompt engineering for AI image generation.',
			},
			{
				role: 'user',
				content: prompt,
			},
		],
	});

	const imagePrompt = response.choices[0].message.content.trim();

	const result = await openai.chat.completions.create({
		model: 'gpt-3.5-turbo',
		messages: [
			{
				role: 'system',
				content: `
					You are an expert visual prompt engineer for AI image generation. 
					Your task is to take an abstract or technical phrase and rewrite it as a detailed, visually descriptive prompt suitable for a text-to-image AI model. 
					Always avoid abstract or purely conceptual language. 
					Instead, describe specific scenes, objects, actions, and visual metaphors that clearly represent the original idea. 
					Include context, setting, and style (like diagram, cartoon, or flat illustration) to ensure the prompt is concrete and easily visualizable.
				`,
			},
			{
				role: 'user',
				content: `Given the phrase '${imagePrompt}', write a detailed, visually descriptive prompt for an image generation AI. The prompt should describe a scene, objects, and actions that visually represent the concept, avoiding technical jargon and focusing on what should be visible in the image.`,
			},
		],
	});

	const refinedImagePrompt = result.choices[0].message.content.trim();

	return refinedImagePrompt;
};
