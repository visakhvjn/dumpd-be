import * as Errors from '../utils/errors.js';

export const isUserAuthorised = async (req, res, next) => {
	if (!req.oidc.isAuthenticated()) {
		throw Errors.UnauthorizedError();
	}

	next();
};
