import dotenv from 'dotenv';
import { pc } from '../config/pinecone.js';

dotenv.config();

export const initializePinecone = async () => {
	const existingIndexes = await pc.listIndexes();
	const existingIndexNames = [];

	if (existingIndexes.indexes.length) {
		existingIndexes.indexes.forEach((index) => {
			existingIndexNames.push(index.name);
		});

		console.log('Existing Pinecone indexes:', existingIndexNames);
	}

	if (!existingIndexNames.includes(process.env.PINECODE_INDEX_NAME)) {
		await pc.createIndex({
			name: process.env.PINECODE_INDEX_NAME,
			vectorType: 'dense',
			dimension: 1536,
			metric: 'cosine',
			spec: {
				serverless: {
					cloud: 'aws',
					region: 'us-east-1',
				},
			},
			waitUntilReady: true,
		});

		console.log('Pinecone index initialized successfully');
	}
};

export const addRecordsToPinecone = async (records) => {
	const index = pc.Index(process.env.PINECODE_INDEX_NAME);
	await index.upsert(records);
};

export const queryRecords = async (embedding, filter) => {
	const index = pc.Index(process.env.PINECODE_INDEX_NAME);

	const results = await index.query({
		vector: embedding,
		topK: 5,
		includeMetadata: true,
		filter,
	});

	const filteredMatches = results.matches.filter((match) => match.score >= 0.5);

	return filteredMatches;
};
