import { json } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';

const USERS_FILE = path.join(process.cwd(), 'src/api/users.json');

// Hàm mã hóa mật khẩu
function encodePassword(password: string): string {
    return Buffer.from(password).toString('base64');
}

// Hàm giải mã mật khẩu
function decodePassword(encodedPassword: string): string {
    return Buffer.from(encodedPassword, 'base64').toString();
}

export async function POST({ request }) {
    try {
        const { action, username, password } = await request.json();
        const usersData = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));

        if (action === 'signup') {
            // Kiểm tra username đã tồn tại chưa
            if (usersData.users.some((user: any) => user.username === username)) {
                return json({ success: false, error: 'Username already exists' }, { status: 400 });
            }

            // Mã hóa mật khẩu trước khi lưu
            const encodedPassword = encodePassword(password);
            usersData.users.push({ username, password: encodedPassword, premium: false });
            fs.writeFileSync(USERS_FILE, JSON.stringify(usersData, null, 2));
            return json({ success: true });

        } else if (action === 'login') {
            // Tìm user và giải mã mật khẩu để so sánh
            const user = usersData.users.find((user: any) => 
                user.username === username && decodePassword(user.password) === password
            );

            if (user) {
                return json({ success: true, premium: user.premium });
            } else {
                return json({ success: false, error: 'Invalid username or password' }, { status: 401 });
            }
        } else if (action === 'upgrade') {
            // Nâng cấp tài khoản lên premium
            const userIndex = usersData.users.findIndex((user: any) => user.username === username);
            if (userIndex === -1) {
                return json({ success: false, error: 'User not found' }, { status: 404 });
            }

            usersData.users[userIndex].premium = true;
            fs.writeFileSync(USERS_FILE, JSON.stringify(usersData, null, 2));
            return json({ success: true });
        }

        return json({ success: false, error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Auth error:', error);
        return json({ success: false, error: 'Server error' }, { status: 500 });
    }
} 