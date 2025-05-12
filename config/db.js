import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDb = async () => {
	try {
		await mongoose.connect(process.env.MONGO_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});

		//TODO: add a ping here to check for db connection

		console.log('MongoDB connected');
	} catch (error) {
		console.error('MongoDB connection error:', error);
	}
};
