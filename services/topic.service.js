import { topicModel } from '../models/Topic.js';

export const getTopics = async () => {
	return topicModel.find({});
};
