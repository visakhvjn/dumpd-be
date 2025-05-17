import { openai } from '../config/openai.js';

import { seriesModel } from '../models/series.model.js';

export const createSeries = async (
	title,
	description,
	slug,
	parts,
	isComplete,
	partsCount
) => {
	return seriesModel.create({
		title,
		description,
		slug,
		parts,
		isComplete,
		partsCount,
	});
};

export const getSeries = async () => {
	const series = await seriesModel
		.find({ isPartsComplete: true })
		.sort({ createdAt: -1 });

	return series;
};

export const getSeriesBySlug = async (slug) => {
	const series = await seriesModel.findOne({ slug });
	return series;
};

export const generateSeriesParts = async () => {
	// get a random series that is not complete
	const series = await seriesModel.aggregate([
		{ $match: { isPartsComplete: false } },
		{ $sample: { size: 1 } },
	]);

	const systemPrompt = getGenerateSeriesPartsSystemPrompt(series[0].partsCount);
	const userPrompt = getGenerateSeriesPartsUserPrompt(
		series[0].title,
		series[0].description,
		series[0].partsCount
	);

	// generate the series parts
	const response = await openai.chat.completions.create({
		model: 'gpt-3.5-turbo',
		messages: [
			{ role: 'system', content: systemPrompt },
			{ role: 'user', content: userPrompt },
		],
	});

	const seriesParts = response.choices[0].message.content;
	const seriesPartsJson = JSON.parse(seriesParts);

	// update the series with the generated parts
	await seriesModel.updateOne(
		{ _id: series[0]._id },
		{
			$set: {
				parts: seriesPartsJson,
				isPartsComplete: true,
			},
		}
	);
};

const getGenerateSeriesPartsSystemPrompt = (partsCount = 10) => {
	return `
		You are a system that generates blogs for a blog series.
		You will be given the title and description of a series.
		You will generate parts for the series based on the title and description.

		You will generate ${partsCount} parts for the series.
		
		Each part of the series will build on the previous part.
		Keep the topics progressive — starting with the fundamentals and gradually moving to advanced or applied use cases.
		Avoid duplication or generic fluff. Each part should cover a distinct concept.

		The output will be a **JSON** array of objects.
		Each object will have the following properties:
		- title: A catchy title for the part which briefly describes the content.
		- description: A short description of the content that will follow.
		- slug: The slug of the part.

		**DO NOT** include any other text in the output.
	`;
};

const getGenerateSeriesPartsUserPrompt = (
	title,
	description,
	partsCount = 10
) => {
	return `
		Generate a ${partsCount} part series on the following topic:
		Title: ${title}
		Description: ${description}
		
		Example output:
		[
			{
				"title": "A catch title of part 1",
				"description": "Short Description of part 1",
				"slug": "unique-slug-of-part-1"
			},
			{
				"title": "A catch title of part 2",
				"description": "short Description of part 2",
				"slug": "unique-slug-of-part-2"
			}
		]
		Make sure to follow the format above.
	`;
};
