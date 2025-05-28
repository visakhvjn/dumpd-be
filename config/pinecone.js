import dotenv from 'dotenv';
import { Pinecone } from '@pinecone-database/pinecone';

dotenv.config();

export const pc = new Pinecone({
	apiKey: process.env.PINECONE_API_KEY,
});
