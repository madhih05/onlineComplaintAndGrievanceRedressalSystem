# Logging Documentation

This project uses **Winston** for comprehensive logging functionality.

## Features

- **Multiple Log Levels**: error, warn, info, http, debug
- **Colorized Console Output**: Different colors for different log levels
- **File Logging**: Separate files for errors and combined logs
- **HTTP Request Logging**: Automatic logging of all HTTP requests with duration
- **Environment-Based Logging**: Debug level in development, warn level in production

## Log Levels

- `error`: Error messages
- `warn`: Warning messages
- `info`: Informational messages
- `http`: HTTP request/response logs
- `debug`: Debug messages (development only)

## Log Files

Logs are stored in the `logs/` directory:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only

## Usage

Import the logger in any file:

```typescript
import logger from '../utils/logger.js';

// Log examples
logger.error('Error message', error);
logger.warn('Warning message');
logger.info('Info message');
logger.http('HTTP message');
logger.debug('Debug message');
```

## HTTP Request Logging

All HTTP requests are automatically logged with:
- HTTP method
- URL path
- Status code
- Response time

Example output:
```
2026-02-19 10:30:45 [http]: POST /api/auth/register - 201 - 245ms
```

## Environment Variables

Set `NODE_ENV` to control log level:
- `development`: Logs all levels (debug and above)
- `production`: Logs only warn and error levels

## Configuration

Logger configuration is in `src/utils/logger.ts`. You can customize:
- Log levels
- Output formats
- File locations
- Transport options
