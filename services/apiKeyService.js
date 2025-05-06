import { apiKeyModel } from '../models/ApiKey.js';

export const isApiKeyValid = async (key) => {
	const apiKey = await apiKeyModel.findOne({
		key,
		active: true,
	});

	return apiKey ? true : false;
};

export const updateApiKey = async (key) => {
	await apiKeyModel.updateOne({ key }, { $inc: { hits: 1 } });
};

export const createApiKey = async (data) => {
	return apiKeyModel.create(data);
};
