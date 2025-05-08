import chai from 'chai';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const { expect } = chai;

const BASE_URL = 'http://localhost:3000';

describe('API Routes', () => {
	// Test for /users route
	describe('GET /api/users', () => {
		it('should return a list of users', async () => {
			const res = await axios.get(`${BASE_URL}/api/users`, {
				headers: { 'x-api-key': process.env.TEST_API_KEY },
			});

			expect(res.status).to.equal(200);
			expect(res.data).to.be.an('array');
		});

		it('should return 401 if API key is missing', async () => {
			try {
				await axios.get(`${BASE_URL}/api/users`);
			} catch (err) {
				expect(err.response.status).to.equal(401);
				expect(err.response.data.message).to.equal('Missing API key');
			}
		});
	});

	// Test for /users/:userId route
	describe('GET /api/users/:userId', () => {
		it('should return a single user', async () => {
			const res = await axios.get(
				`${BASE_URL}/api/users/681611ccc0eb99472df5ff28`,
				{
					headers: { 'x-api-key': process.env.TEST_API_KEY },
				}
			);
			expect(res.status).to.equal(200);
			expect(res.data).to.have.property('_id', '681611ccc0eb99472df5ff28');
		});

		it('should return 400 if userId is invalid', async () => {
			try {
				await axios.get(`${BASE_URL}/api/users/nonexistent`, {
					headers: { 'x-api-key': process.env.TEST_API_KEY },
				});
			} catch (err) {
				expect(err.response.status).to.equal(400);
			}
		});
	});

	// Test for /blogs route
	describe('GET /api/blogs', () => {
		it('should return a list of blogs', async () => {
			const res = await axios.get(`${BASE_URL}/api/blogs`, {
				headers: { 'x-api-key': process.env.TEST_API_KEY },
			});

			expect(res.status).to.equal(200);
			expect(res.data).to.be.an('array');
		});

		it('should filter blogs by category', async () => {
			const res = await axios.get(`${BASE_URL}/api/blogs?category=iot`, {
				headers: { 'x-api-key': process.env.TEST_API_KEY },
			});

			expect(res.status).to.equal(200);
			expect(res.data.every((blog) => blog.categories.includes('IoT'))).to.be
				.true;
		});
	});

	// Test for /blogs/:blogIdOrSlug route
	describe('GET /api/blogs/:blogIdOrSlug', () => {
		it('should return a single blog', async () => {
			const res = await axios.get(
				`${BASE_URL}/api/blogs/hybrid-cloud-edge:-the-ultimate-duo-powering-next-gen-iot!`,
				{ headers: { 'x-api-key': process.env.TEST_API_KEY } }
			);
			expect(res.status).to.equal(200);
			expect(res.data.blog).to.have.property(
				'slug',
				'hybrid-cloud-edge:-the-ultimate-duo-powering-next-gen-iot!'
			);
		});

		it('should return 404 if blog is not found', async () => {
			try {
				await axios.get(`${BASE_URL}/api/blogs/nonexistent`, {
					headers: { 'x-api-key': process.env.TEST_API_KEY },
				});
			} catch (err) {
				expect(err.response.status).to.equal(404);
			}
		});
	});
});

describe('Page Routes', () => {
	// Test for /blogs route
	describe('GET /', () => {
		it('should render the home page', async () => {
			const res = await axios.get(`${BASE_URL}/`);
			expect(res.status).to.equal(200);
		});
	});

	// Test for /about route
	describe('GET /about', () => {
		it('should render the about page', async () => {
			const res = await axios.get(`${BASE_URL}/about`);
			expect(res.status).to.equal(200);
			expect(res.data).to.include('<h1>About The AI Blog</h1>');
		});
	});

	// Test for /api/docs route
	describe('GET /api/docs', () => {
		it('should render the swagger page', async () => {
			const res = await axios.get(`${BASE_URL}/api/docs`);
			expect(res.status).to.equal(200);
			expect(res.data).to.include('swagger-ui');
		});
	});

	// Test for 404 page
	describe('GET /nonexistent', () => {
		it('should render the 404 page for non-existent routes', async () => {
			try {
				await axios.get(`${BASE_URL}/nonexistent`);
			} catch (err) {
				expect(err.response.status).to.equal(404);
				expect(err.response.data).to.include('404 - Page Not Found');
			}
		});
	});
});
