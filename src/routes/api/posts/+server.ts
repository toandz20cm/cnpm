// src/routes/api/posts/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'static', 'uploads');
const DATA_FILE = path.join(process.cwd(), 'src', 'lib', 'posts.json');

// Đảm bảo thư mục và file tồn tại
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');

let postsData: any[] = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

export const GET: RequestHandler = async () => {
	return json(postsData);
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const formData = await request.formData();

		const comment = formData.get('comment') as string;
		const author = formData.get('author') as string; // Thêm author từ form
		const originalFile = formData.get('originalFile') as File;
		const aiFile = formData.get('aiFile') as File;

		if (!comment || !originalFile || !aiFile) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		const saveFile = async (file: File) => {
			const buffer = await file.arrayBuffer();
			const fileName = `${Date.now()}-${file.name}`;
			fs.writeFileSync(path.join(UPLOAD_DIR, fileName), Buffer.from(buffer));
			return `/uploads/${fileName}`;
		};

		const [originalPath, aiPath] = await Promise.all([
			saveFile(originalFile),
			saveFile(aiFile)
		]);

		const newPost = {
			id: Date.now(),
			comment,
			originalFile: originalPath,
			aiFile: aiPath,
			author, // Sử dụng author từ form
			time: new Date().toLocaleString()
		};

		postsData = [newPost, ...postsData];
		fs.writeFileSync(DATA_FILE, JSON.stringify(postsData));

		return json(newPost, { status: 201 });
	} catch (error) {
		console.error('Error:', error);
		return json({ error: 'Server error' }, { status: 500 });
	}
};