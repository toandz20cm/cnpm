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
        const { action, username, password, currentPassword, newPassword, targetUsername, message } = await request.json();
        const usersData = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));

        if (action === 'signup') {
            // Kiểm tra username đã tồn tại chưa
            if (usersData.users.some((user: any) => user.username === username)) {
                return json({ success: false, error: 'Username already exists' }, { status: 400 });
            }

            // Mã hóa mật khẩu trước khi lưu
            const encodedPassword = encodePassword(password);
            usersData.users.push({ username, password: encodedPassword, premium: false, isAdmin: false });
            fs.writeFileSync(USERS_FILE, JSON.stringify(usersData, null, 2));
            return json({ success: true });
        } else if (action === 'login') {
            // Tìm user và giải mã mật khẩu để so sánh
            const user = usersData.users.find((user: any) => 
                user.username === username && decodePassword(user.password) === password
            );

            if (user) {
                return json({ 
                    success: true, 
                    premium: user.premium, 
                    isAdmin: user.isAdmin,
                    notifications: usersData.notifications || []
                });
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
        } else if (action === 'changePassword') {
            // Tìm user và kiểm tra mật khẩu hiện tại
            const userIndex = usersData.users.findIndex((user: any) => 
                user.username === username && decodePassword(user.password) === currentPassword
            );

            if (userIndex === -1) {
                return json({ success: false, error: 'Current password is incorrect' }, { status: 401 });
            }

            // Cập nhật mật khẩu mới
            usersData.users[userIndex].password = encodePassword(newPassword);
            fs.writeFileSync(USERS_FILE, JSON.stringify(usersData, null, 2));
            return json({ success: true });
        } else if (action === 'getUsers') {
            // Kiểm tra quyền admin
            const adminUser = usersData.users.find((user: any) => 
                user.username === username && decodePassword(user.password) === password && user.isAdmin
            );

            if (!adminUser) {
                return json({ success: false, error: 'Unauthorized' }, { status: 403 });
            }

            // Trả về danh sách người dùng (không bao gồm mật khẩu)
            const users = usersData.users.map((user: any) => ({
                username: user.username,
                premium: user.premium,
                isAdmin: user.isAdmin
            }));

            return json({ success: true, users, notifications: usersData.notifications || [] });
        } else if (action === 'deleteUser') {
            // Kiểm tra quyền admin
            const adminUser = usersData.users.find((user: any) => 
                user.username === username && decodePassword(user.password) === password && user.isAdmin
            );

            if (!adminUser) {
                return json({ success: false, error: 'Unauthorized' }, { status: 403 });
            }

            // Không cho phép xóa tài khoản admin
            const targetUser = usersData.users.find((user: any) => user.username === targetUsername);
            if (targetUser?.isAdmin) {
                return json({ success: false, error: 'Cannot delete admin account' }, { status: 400 });
            }

            // Xóa người dùng
            usersData.users = usersData.users.filter((user: any) => user.username !== targetUsername);
            fs.writeFileSync(USERS_FILE, JSON.stringify(usersData, null, 2));
            return json({ success: true });
        } else if (action === 'togglePremium') {
            // Kiểm tra quyền admin
            const adminUser = usersData.users.find((user: any) => 
                user.username === username && decodePassword(user.password) === password && user.isAdmin
            );

            if (!adminUser) {
                return json({ success: false, error: 'Unauthorized' }, { status: 403 });
            }

            // Toggle trạng thái premium
            const userIndex = usersData.users.findIndex((user: any) => user.username === targetUsername);
            if (userIndex === -1) {
                return json({ success: false, error: 'User not found' }, { status: 404 });
            }

            usersData.users[userIndex].premium = !usersData.users[userIndex].premium;
            fs.writeFileSync(USERS_FILE, JSON.stringify(usersData, null, 2));
            return json({ success: true, premium: usersData.users[userIndex].premium });
        } else if (action === 'sendNotification') {
            // Kiểm tra quyền admin
            const adminUser = usersData.users.find((user: any) => 
                user.username === username && decodePassword(user.password) === password && user.isAdmin
            );

            if (!adminUser) {
                return json({ success: false, error: 'Unauthorized' }, { status: 403 });
            }

            // Thêm thông báo mới
            const newNotification = {
                id: Date.now(),
                message: message,
                timestamp: new Date().toISOString()
            };

            if (!usersData.notifications) {
                usersData.notifications = [];
            }

            usersData.notifications.push(newNotification);
            fs.writeFileSync(USERS_FILE, JSON.stringify(usersData, null, 2));
            return json({ success: true, notifications: usersData.notifications });
        }

        return json({ success: false, error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Auth error:', error);
        return json({ success: false, error: 'Server error' }, { status: 500 });
    }
} 