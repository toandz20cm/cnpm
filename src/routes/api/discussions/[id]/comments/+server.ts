import { json, type RequestHandler } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'src', 'lib', 'discussions.json');

if (!fs.existsSync(DB_PATH)) {
	fs.writeFileSync(DB_PATH, '[]', 'utf-8');
}

export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const { id } = params;
		const { content, author } = await request.json();

		if (!content || !author) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		const discussions = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

		const discussionIndex = discussions.findIndex(d => d.id === parseInt(id));
		if (discussionIndex === -1) {
			return json({ error: 'Discussion not found' }, { status: 404 });
		}

		const newComment = {
			id: Date.now(),
			content,
			author,
			time: new Date().toISOString()
		};

		if (!discussions[discussionIndex].comments) {
			discussions[discussionIndex].comments = [];
		}
		discussions[discussionIndex].comments.push(newComment);

		fs.writeFileSync(DB_PATH, JSON.stringify(discussions, null, 2));

		return json(discussions[discussionIndex]);
	} catch (error) {
		console.error('Error adding comment:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const GET: RequestHandler = async () => {
	try {
		const discussions = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
		return json(discussions);
	} catch (error) {
		console.error('Error fetching discussions:', error);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
};
