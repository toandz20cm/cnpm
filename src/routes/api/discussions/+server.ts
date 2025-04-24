import { json, type RequestHandler } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'src', 'lib', 'discussions.json');

if (!fs.existsSync(DB_PATH)) {
	fs.writeFileSync(DB_PATH, '[]');
}

interface Discussion {
	id: number;
	title: string;
	content: string;
	author: string;
	time: string;
	comments: {
		id: number;
		content: string;
		author: string;
		time: string;
	}[];
}

const readDb = (): Discussion[] => {
	return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
};

const writeDb = (data: Discussion[]) => {
	fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

export const GET: RequestHandler = async () => {
	const discussions = readDb();
	return json(discussions);
};

export const POST: RequestHandler = async ({ request }) => {
	const { title, content, author } = await request.json();

	if (!title || !content || !author) {
		return json({ error: 'Missing required fields' }, { status: 400 });
	}

	const discussions = readDb();
	const newDiscussion: Discussion = {
		id: Date.now(),
		title,
		content,
		author,
		time: new Date().toISOString(),
		comments: []
	};

	discussions.unshift(newDiscussion);
	writeDb(discussions);

	return json(newDiscussion, { status: 201 });
};
