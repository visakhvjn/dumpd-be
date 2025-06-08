import * as Errors from '../utils/errors.js';

export const isUserAuthorised = async (req, res, next) => {
	if (!req.oidc.isAuthenticated()) {
		throw new Errors.UnauthorizedError();
	}

	next();
};

export const hasAPIKey = async (req, res, next) => {
	const apiKey = req.headers['x-api-key'];

	console.log(apiKey);

	if (!apiKey) {
		return res.status(401).json({ error: 'API key missing' });
	}

	const validApiKey = process.env.APP_API_KEY;

	if (apiKey !== validApiKey) {
		return res.status(403).json({ error: 'Invalid API key' });
	}

	next();
};
