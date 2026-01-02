# DailySync

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://prettier.io/)

## Recent Fixes

### SQLite Database Issues Fixed

The following SQLite database locking and concurrency issues have been resolved:

1. **Database Connection Management**
   - Implemented singleton pattern for database connections
   - Added proper connection pooling and reuse
   - Fixed database locking issues with WAL mode and optimized PRAGMA settings

2. **Transaction Handling**
   - Added retry mechanism for database operations
   - Implemented proper transaction rollback on errors
   - Fixed concurrent access issues

3. **Error Recovery**
   - Added comprehensive error handling for database operations
   - Implemented automatic retry with exponential backoff
   - Added proper cleanup for database connections

### Notification System Fixes

The following notification-related issues have been resolved:

1. **Notifee Integration**
   - Fixed notification channel creation
   - Properly configured notification listeners
   - Added proper error handling for notification operations

2. **Background/Foreground Events**
   - Fixed notification event handling
   - Properly configured action listeners
   - Added proper cleanup for notification listeners

## Code Quality Workflow

- **Formatting:** Automatically checked on commit with Prettier.
- **Linting:** Checked on push with ESLint.
- **Type Checking:** Checked on push with TypeScript.
- **Commit Messages:** Enforced with commitlint (Conventional Commits).

### Scripts

- `yarn lint` — Run ESLint
- `yarn format` — Run Prettier

## Database Schema

The app uses SQLite with the following schema:

### Notifications Table

- `id` (TEXT PRIMARY KEY)
- `type` (TEXT NOT NULL)
- `message` (TEXT NOT NULL)
- `date` (TEXT NOT NULL)
- `subject` (TEXT)
- `attachments` (TEXT)
- `scheduleFrequency` (TEXT)
- `memo` (TEXT)
- `toMail` (TEXT)
- `telegramUsername` (TEXT)
- `days` (TEXT)
- `latitude` (REAL)
- `longitude` (REAL)
- `radius` (INTEGER)
- `locationName` (TEXT)

### Contacts Table

- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `notification_id` (TEXT)
- `name` (TEXT NOT NULL)
- `number` (TEXT)
- `recordID` (TEXT NOT NULL)
- `thumbnailPath` (TEXT)

### Device Contacts Table

- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `name` (TEXT NOT NULL)
- `number` (TEXT)
- `recordID` (TEXT NOT NULL)
- `thumbnailPath` (TEXT)

## Troubleshooting

### Database Issues

If you encounter database locking issues:

1. Clear the app data and restart
2. Check that no other processes are accessing the database
3. Ensure proper database connection cleanup

### Notification Issues

If notifications are not working:

1. Check notification permissions in device settings
2. Verify notification channels are created
3. Check that the app is not in battery optimization mode

### Keystore and Password 
Key: key0
Pass: dailysync