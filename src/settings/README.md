# Real-time System Information

This module provides real-time system information updates via WebSocket. The system information includes:

- CPU information (count, model, speed)
- Memory information (total, free, used, usage percentage)
- OS information (platform, name, version)
- System uptime
- Current time

## REST API Endpoint

You can get the current system information via the REST API:

```
GET /settings/system-info
```

This endpoint returns the current system information and backup configuration.

## WebSocket Endpoint

For real-time updates, connect to the WebSocket endpoint:

```
ws://your-server-url:3003/system-info
```

The WebSocket server emits system information updates every 5 seconds to all connected clients.

### WebSocket Events

- `systemInfo`: Emitted when new system information is available

### Example Usage

```javascript
// Connect to the WebSocket server
const socket = io('http://your-server-url:3003/system-info');

// Listen for system info updates
socket.on('systemInfo', (data) => {
    console.log('Received system info:', data);
    // Update your UI with the system info
});

// Handle connection events
socket.on('connect', () => {
    console.log('Connected to system info WebSocket');
});

socket.on('disconnect', () => {
    console.log('Disconnected from system info WebSocket');
});
```

## Client Example

A complete client example is provided in the `system-info-client-example.html` file. This example demonstrates how to connect to the WebSocket endpoint and display real-time system information updates.

To use the example:

1. Open the `system-info-client-example.html` file in a web browser
2. Click the "Connect" button to connect to the WebSocket server
3. The system information will be displayed and updated in real-time

## Response Format

The system information response has the following format:

```json
{
  "systemInfo": {
    "platform": "Windows_NT",
    "osName": "Windows 10 Pro",
    "osVersion": "10.0.19042",
    "cpu": {
      "count": 8,
      "model": "Intel(R) Core(TM) i7-10700K CPU @ 3.80GHz",
      "speed": 3800
    },
    "memory": {
      "total": 16384,
      "free": 8192,
      "used": 8192,
      "usagePercentage": 50
    },
    "uptime": 3600,
    "currentTime": "2023-05-15T10:30:00.000Z"
  },
  "backupInfo": {
    "schedule": "daily",
    "cronExpression": "0 0 * * *",
    "backupDirectory": "/backups",
    "retentionDays": 7,
    "enabled": true,
    "lastBackupTime": "2023-05-15T00:00:00.000Z",
    "nextBackupTime": "2023-05-16T00:00:00.000Z"
  }
}
```