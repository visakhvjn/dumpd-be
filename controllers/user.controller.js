import * as userService from '../services/user.service.js';

export const generateUser = async (req, res) => {
	const user = await userService.generateUser();
	res.json(user);
};

export const authoriseUser = async (req, res, next) => {
	if (req.oidc.isAuthenticated()) {
		const user = req.oidc.user;
		const existingUser = await userService.doesUserExist(user.email);

		if (existingUser) {
			req.userId = existingUser._id;
		}

		if (!existingUser && user) {
			const user = await userService.createUser(user, true);
			req.userId = user._id;
		}
	}

	next();
};
