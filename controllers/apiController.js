import * as userService from '../services/userService.js';
import mongoose from 'mongoose';

const getBlogs = async (req, res) => {};
const getBlog = async (req, res) => {};

export const getUsers = async (req, res) => {
	const users = await userService.getUsers();
	res.json(users);
};

export const getUser = async (req, res) => {
	const { userId } = req.params;

	if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
		res.status(400).json({ error: 'Invalid userId!' });
	}

	const user = await userService.getUser(userId);

	if (!user) {
		res.status(404).json({ error: 'User not found!' });
	}

	res.json(user);
};
