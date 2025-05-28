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
