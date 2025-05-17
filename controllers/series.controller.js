import moment from 'moment';

import * as seriesService from '../services/series.service.js';
import * as Errors from '../utils/errors.js';

export const getSeries = async (req, res) => {
	try {
		const series = await seriesService.getSeries();
		const formattedSeries = series.map((item) => ({
			...item._doc,
			createdAt: moment(item.createdAt).format('MMM DD, YYYY'),
		}));

		res.render('series', {
			series: formattedSeries,
			isLoggedIn: req.oidc.isAuthenticated(),
			authUser: req.oidc.user,
		});
	} catch (err) {
		res.status(err.statusCode).json({ error: err.message });
	}
};

export const createSeries = async (req, res) => {
	try {
		const { title, description, slug, parts, isComplete, partsCount } =
			req.body;

		if (!title || !description || !slug) {
			throw new Errors.BadRequestError(
				'title, description and slug cannot be empty!'
			);
		}

		const series = await seriesService.createSeries(
			title,
			description,
			slug,
			parts,
			isComplete ? isComplete : false,
			partsCount ? partsCount : 10
		);

		res.status(200).json(series);
	} catch (error) {
		res.status(error.statusCode).json({ error: error.message });
	}
};

export const generateSeries = async (req, res) => {
	try {
		const series = await seriesService.generateSeriesParts();
		res.status(200).json(series);
	} catch (error) {
		res.status(error.statusCode).json({ error: error.message });
	}
};

export const getSeriesBySlug = async (req, res) => {
	try {
		const { slug } = req.params;

		if (!slug) {
			throw new Errors.BadRequestError('Slug cannot be empty!');
		}

		const serial = await seriesService.getSeriesBySlug(slug);

		if (!serial) {
			throw new Errors.NotFoundError('Series not found!');
		}

		const formattedSerial = {
			...serial._doc,
			createdAt: serial.createdAt
				? moment(serial.createdAt).format('MMM DD, YYYY')
				: '',
			parts: serial.parts
				? serial.parts.map((part) => ({
						...part._doc,
						createdAt: part.createdAt
							? moment(part.createdAt).format('MMM DD, YYYY')
							: '',
				  }))
				: [],
		};

		res.render('serial', {
			serial: formattedSerial,
			isLoggedIn: req.oidc.isAuthenticated(),
			authUser: req.oidc.user,
		});
	} catch (error) {
		res.status(error.statusCode).json({ error: error.message });
	}
};
