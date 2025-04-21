import { json } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';

const USERS_INFO_PATH = path.join(process.cwd(), 'static', 'usersInfor.json');

function readUsersInfo() {
    try {
        const data = fs.readFileSync(USERS_INFO_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { users: [] };
    }
}

function writeUsersInfo(data: any) {
    fs.writeFileSync(USERS_INFO_PATH, JSON.stringify(data, null, 2));
}

export async function POST({ request }) {
    const { action, username, userInfo } = await request.json();

    const usersData = readUsersInfo();

    switch (action) {
        case 'getUserInfo':
            const user = usersData.users.find((u: any) => u.username === username);
            return json({ success: true, userInfo: user?.info || null });

        case 'updateUserInfo':
            const userIndex = usersData.users.findIndex((u: any) => u.username === username);
            
            if (userIndex === -1) {
                // Add new user info
                usersData.users.push({
                    username,
                    info: userInfo
                });
            } else {
                // Update existing user info
                usersData.users[userIndex].info = userInfo;
            }

            writeUsersInfo(usersData);
            return json({ success: true });

        default:
            return json({ success: false, error: 'Invalid action' });
    }
} 