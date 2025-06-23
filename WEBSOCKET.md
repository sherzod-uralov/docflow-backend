# WebSocket Documentation for DocFlow

## Overview

DocFlow provides real-time updates through WebSockets for approval workflows. This document explains how to connect to the WebSocket server, available events, and how to interact with the WebSocket API.

## Connecting to the WebSocket Server

The WebSocket server is available at the same host as the REST API, with a specific namespace for approval workflows:

```javascript
import { io } from 'socket.io-client';

// Connect to the WebSocket server
const socket = io('http://your-api-host:3003/approval-workflows', {
  query: {
    userId: '123' // Replace with the actual user ID
  },
  transports: ['websocket'],
  autoConnect: true
});

// Handle connection events
socket.on('connect', () => {
  console.log('Connected to WebSocket server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket server');
});

socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

## Available Events

### Server to Client Events

These events are emitted by the server and can be listened to by clients:

#### `workflowUpdated`

Emitted when an approval workflow is updated.

```javascript
socket.on('workflowUpdated', (workflow) => {
  console.log('Workflow updated:', workflow);
  // Update UI with the new workflow data
});
```

#### `stepUpdated`

Emitted when an approval step is updated.

```javascript
socket.on('stepUpdated', (step) => {
  console.log('Step updated:', step);
  // Update UI with the new step data
});
```

#### `statisticsUpdated`

Emitted when approval workflow statistics are updated.

```javascript
socket.on('statisticsUpdated', (statistics) => {
  console.log('Statistics updated:', statistics);
  // Update UI with the new statistics data
});
```

### Client to Server Events

These events can be emitted by clients to request actions from the server:

#### `markStepAsRead`

Mark an approval step as read.

```javascript
socket.emit('markStepAsRead', {
  stepId: 123,
  userId: 456
}, (response) => {
  if (response.event === 'error') {
    console.error('Error marking step as read:', response.data.message);
  } else {
    console.log('Step marked as read:', response.data);
  }
});
```

#### `getStatistics`

Request current approval workflow statistics.

```javascript
socket.emit('getStatistics', {}, (response) => {
  if (response.event === 'error') {
    console.error('Error getting statistics:', response.data.message);
  } else {
    console.log('Statistics:', response.data);
  }
});
```

## Event Payloads

### Workflow Object

```typescript
interface Workflow {
  id: number;
  documentId: number;
  type: 'SEQUENTIAL' | 'PARALLEL' | 'AGREEMENT' | 'SIGNATURE';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  initiatedBy: number;
  qrCodeUrl?: string;
  signatureUrl?: string;
  createdAt: string;
  updatedAt: string;
  document?: {
    id: number;
    title: string;
    fileUrl: string;
  };
  initiator?: {
    id: number;
    username: string;
    email: string;
  };
  steps?: ApprovalStep[];
}
```

### Approval Step Object

```typescript
interface ApprovalStep {
  id: number;
  workflowId: number;
  approverId: number;
  order: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED';
  comment?: string;
  rejectionReason?: string;
  returnToStepId?: number;
  isRead: boolean;
  readAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  approver?: {
    id: number;
    username: string;
    email: string;
  };
  workflow?: Workflow;
}
```

### Statistics Object

```typescript
interface WorkflowStatistics {
  totalWorkflows: number;
  totalSteps: number;
  statusCounts: {
    pending: number;
    inProgress: number;
    completed: number;
    rejected: number;
  };
  typeCounts: {
    sequential: number;
    parallel: number;
    agreement: number;
    signature: number;
  };
  stepStatusCounts: {
    pending: number;
    approved: number;
    rejected: number;
    returned: number;
  };
  readStatusCounts: {
    read: number;
    unread: number;
  };
  date: string;
}
```

## Room-Based Communication

The WebSocket server uses rooms to target specific users:

- When a user connects, they automatically join a room named `user-{userId}`
- Updates for a specific user are sent to their room
- Global updates are sent to all connected clients

## Error Handling

All client-to-server events return responses that include an `event` property. If an error occurs, the `event` will be `'error'` and the `data` will contain an error message:

```javascript
{
  event: 'error',
  data: {
    message: 'Error message'
  }
}
```

## Complete Example

Here's a complete example of connecting to the WebSocket server and handling events:

```javascript
import { io } from 'socket.io-client';

class ApprovalWorkflowsSocket {
  constructor(apiUrl, userId) {
    this.socket = io(`${apiUrl}/approval-workflows`, {
      query: { userId },
      transports: ['websocket'],
      autoConnect: true
    });
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Connection events
    this.socket.on('connect', this.handleConnect.bind(this));
    this.socket.on('disconnect', this.handleDisconnect.bind(this));
    this.socket.on('error', this.handleError.bind(this));
    
    // Data events
    this.socket.on('workflowUpdated', this.handleWorkflowUpdated.bind(this));
    this.socket.on('stepUpdated', this.handleStepUpdated.bind(this));
    this.socket.on('statisticsUpdated', this.handleStatisticsUpdated.bind(this));
  }
  
  handleConnect() {
    console.log('Connected to WebSocket server');
  }
  
  handleDisconnect() {
    console.log('Disconnected from WebSocket server');
  }
  
  handleError(error) {
    console.error('WebSocket error:', error);
  }
  
  handleWorkflowUpdated(workflow) {
    console.log('Workflow updated:', workflow);
    // Update UI with the new workflow data
  }
  
  handleStepUpdated(step) {
    console.log('Step updated:', step);
    // Update UI with the new step data
  }
  
  handleStatisticsUpdated(statistics) {
    console.log('Statistics updated:', statistics);
    // Update UI with the new statistics data
  }
  
  markStepAsRead(stepId, userId) {
    return new Promise((resolve, reject) => {
      this.socket.emit('markStepAsRead', { stepId, userId }, (response) => {
        if (response.event === 'error') {
          reject(new Error(response.data.message));
        } else {
          resolve(response.data);
        }
      });
    });
  }
  
  getStatistics() {
    return new Promise((resolve, reject) => {
      this.socket.emit('getStatistics', {}, (response) => {
        if (response.event === 'error') {
          reject(new Error(response.data.message));
        } else {
          resolve(response.data);
        }
      });
    });
  }
  
  disconnect() {
    this.socket.disconnect();
  }
}

// Usage
const socket = new ApprovalWorkflowsSocket('http://your-api-host:3003', '123');

// Mark a step as read
socket.markStepAsRead(123, 456)
  .then(data => console.log('Step marked as read:', data))
  .catch(error => console.error('Error marking step as read:', error));

// Get statistics
socket.getStatistics()
  .then(statistics => console.log('Statistics:', statistics))
  .catch(error => console.error('Error getting statistics:', error));
```