import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const userId = parseInt(req.query.id);
            console.log('Fetching groups for user:', userId);

            if (!userId || isNaN(userId)) {
                console.error('Invalid user ID:', req.query.id);
                return res.status(400).json({ error: 'Invalid user ID' });
            }

            // Find all groups where user is either a member or creator
            const groups = await prisma.group.findMany({
                where: {
                    OR: [
                        { created_by: userId },
                        {
                            groupmember: {
                                some: {
                                    user_id: userId
                                }
                            }
                        }
                    ]
                },
                include: {
                    groupmember: {
                        include: {
                            user: true
                        }
                    },
                    user: true
                }
            });

            console.log('Found groups:', groups);

            // Format the response
            const formattedGroups = groups.map(group => {
                // Check if creator is already in members list
                const creatorInMembers = group.groupmember.some(member => 
                    member.user_id === group.created_by
                );

                const members = creatorInMembers 
                    ? group.groupmember.map(member => ({
                        user_id: member.user_id,
                        name: member.user.name,
                        email: member.user.email,
                        role: member.user_id === group.created_by ? 'creator' : (member.role || 'member')
                    }))
                    : [
                        {
                            user_id: group.created_by,
                            name: group.user.name,
                            email: group.user.email,
                            role: 'creator'
                        },
                        ...group.groupmember.map(member => ({
                            user_id: member.user_id,
                            name: member.user.name,
                            email: member.user.email,
                            role: member.role || 'member'
                        }))
                    ];
                
                return {
                    id: group.group_id,
                    group_name: group.group_name,
                    max_members: group.max_members,
                    // Only add +1 if creator is not in members list
                    current_members: group.groupmember.length + (creatorInMembers ? 0 : 1),
                    created_by: group.created_by,
                    created_at: group.created_at,
                    join_code: group.join_code,
                    members: members,
                    total_members: members.length
                };
            });

            console.log('Formatted groups:', formattedGroups);
            res.status(200).json(formattedGroups);
        } catch (error) {
            console.error('Error fetching user groups:', error);
            res.status(500).json({ error: 'Failed to fetch user groups' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
