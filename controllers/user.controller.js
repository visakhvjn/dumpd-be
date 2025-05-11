import * as userService from '../services/user.service.js';

export const generateUser = async (req, res) => {
	const user = await userService.generateUser();
	res.json(user);
};
