import { json } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';

const USERS_FILE = path.join(process.cwd(), 'src/api/users.json');

export async function POST({ request }) {
    try {
        const { action, username, password } = await request.json();
        const usersData = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));

        if (action === 'signup') {
            // Kiểm tra username đã tồn tại chưa
            if (usersData.users.some((user: any) => user.username === username)) {
                return json({ success: false, error: 'Username already exists' }, { status: 400 });
            }

            // Thêm user mới
            usersData.users.push({ username, password });
            fs.writeFileSync(USERS_FILE, JSON.stringify(usersData, null, 2));
            return json({ success: true });

        } else if (action === 'login') {
            // Kiểm tra thông tin đăng nhập
            const user = usersData.users.find((user: any) => 
                user.username === username && user.password === password
            );

            if (user) {
                return json({ success: true });
            } else {
                return json({ success: false, error: 'Invalid username or password' }, { status: 401 });
            }
        }

        return json({ success: false, error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Auth error:', error);
        return json({ success: false, error: 'Server error' }, { status: 500 });
    }
} 