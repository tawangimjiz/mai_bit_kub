import prisma from '../../lib/prisma';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    if (req.method === 'GET') {
        try {
            const userId = parseInt(req.query.userId);
            
            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }

            const notifications = await prisma.notification.findMany({
                where: {
                    user_id: userId
                },
                orderBy: {
                    created_at: 'desc'
                },
                include: {
                    group: {
                        select: {
                            group_name: true
                        }
                    }
                }
            });

            res.status(200).json(notifications);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            res.status(500).json({ error: 'Failed to fetch notifications' });
        }
    } else if (req.method === 'PUT') {
        // Mark notification as read
        try {
            const { notification_id } = req.body;
            
            if (!notification_id) {
                return res.status(400).json({ error: 'Notification ID is required' });
            }

            const updatedNotification = await prisma.notification.update({
                where: {
                    notification_id: parseInt(notification_id)
                },
                data: {
                    is_read: true
                }
            });

            res.status(200).json(updatedNotification);
        } catch (error) {
            console.error('Error updating notification:', error);
            res.status(500).json({ error: 'Failed to update notification' });
        }
    } else if (req.method === 'DELETE') {
        // ลบการแจ้งเตือนที่อ่านแล้ว
        try {
            const userId = parseInt(req.query.userId);
            
            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }

            await prisma.notification.deleteMany({
                where: {
                    user_id: userId,
                    is_read: true
                }
            });

            res.status(200).json({ message: 'Read notifications cleared successfully' });
        } catch (error) {
            console.error('Error clearing notifications:', error);
            res.status(500).json({ error: 'Failed to clear notifications' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}