# Admin Powers List

## 1. Content Moderation
- Delete any post
- Delete any reply
- Soft-hide post/reply (kept in DB, hidden from users)
- Restore hidden content

## 2. Reports Management
- View all reports in one admin panel
- Mark report status: open, reviewed, resolved
- See report reason and linked content quickly

## 3. User Moderation
- View user profile summary (posts, replies, reports count)
- Temporarily suspend user posting/replying
- Ban and unban user
- Optional shadow-ban support

## 4. Feed Controls
- Pin and unpin post
- Lock and unlock post (no more replies)
- Mark post as sensitive/NSFW
- Feature posts in a curated section

## 5. Data Visibility
- See all posts including private/my-post scope content
- See deleted/hidden items in admin-only audit view

## 6. Safety Controls
- Keyword blocklist for post/reply submission
- Rate-limit override tuning
- Disable new signups temporarily (maintenance mode)

## 7. Admin Audit
- Track who performed admin actions
- Store action logs: action type, target id, time, admin id
- Export moderation logs (optional)

## 8. Role Management
- Promote user to admin
- Demote admin to user
- Extend to multiple roles later (moderator, superadmin)

## Recommended First Milestone
1. Admin-only report dashboard
2. Admin delete/hide post and reply
3. Basic audit log table
4. RLS policies enforcing admin permissions at DB level
