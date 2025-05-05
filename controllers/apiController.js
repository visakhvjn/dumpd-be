import * as userService from '../services/userService.js';

const getBlogs = async (req, res) => {};
const getBlog = async (req, res) => {};

export const getUsers = async (req, res) => {
	const users = await userService.getUsers();
	res.json(users);
};
