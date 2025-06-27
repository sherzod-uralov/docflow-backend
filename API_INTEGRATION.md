# Frontend API Integration Guide for Document Approval Workflow

This guide is designed for frontend developers who need to integrate with the Document Approval Workflow API. It provides detailed information about authentication, available endpoints, request/response formats, error handling, and best practices.

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
   - [Create a Workflow](#create-a-workflow)
   - [Get All Workflows](#get-all-workflows)
   - [Get Workflow by ID](#get-workflow-by-id)
   - [Get Pending Approvals](#get-pending-approvals)
   - [Get Returned Steps](#get-returned-steps)
   - [Update Step Status](#update-step-status)
   - [Get Returnable Users](#get-returnable-users)
   - [Get Resubmission Target](#get-resubmission-target)
   - [Get Return History](#get-return-history)
4. [Error Handling](#error-handling)
5. [Best Practices](#best-practices)
6. [Common Scenarios](#common-scenarios)

## Overview

The Document Approval Workflow API allows you to create and manage approval workflows for documents. Documents can be routed through a series of approvers in either a sequential or parallel manner. Approvers can approve, reject, return, or request resubmission of documents.

### Workflow Types

- **SEQUENTIAL**: Approvers review the document one after another in a predefined order.
- **PARALLEL**: All approvers can review the document simultaneously.

### Step Statuses

- **PENDING**: The step is waiting for the approver's action.
- **APPROVED**: The approver has approved the step.
- **REJECTED**: The approver has rejected the step.
- **RETURNED**: The approver has returned the step to a previous approver for revision.
- **RESUBMITTED**: A previously returned step has been corrected and resubmitted.

## Authentication

All API requests require authentication using JWT (JSON Web Token). You need to include the token in the Authorization header of your requests.

```javascript
// Example of setting the Authorization header in Axios
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// Example of setting the Authorization header in fetch
fetch(url, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

To obtain a token, you need to authenticate with the system using the login endpoint:

```javascript
// Example of logging in and obtaining a token
async function login(username, password) {
  try {
    const response = await axios.post('/auth/login', {
      username,
      password
    });
    
    const token = response.data.access_token;
    // Store the token securely (e.g., in localStorage or a secure cookie)
    localStorage.setItem('token', token);
    
    return token;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}
```

## API Endpoints

### Create a Workflow

Creates a new approval workflow for a document.

**Endpoint:** `POST /approval-workflows`

**Request Body:**

```json
{
  "documentId": 1,
  "type": "SEQUENTIAL",
  "deadline": "2023-12-31T23:59:59Z",
  "steps": [
    {
      "approverId": 2,
      "order": 1,
      "deadline": "2023-12-15T23:59:59Z"
    },
    {
      "approverId": 3,
      "order": 2,
      "deadline": "2023-12-20T23:59:59Z"
    },
    {
      "approverId": 4,
      "order": 3,
      "deadline": "2023-12-25T23:59:59Z"
    }
  ]
}
```

**Response:**

```json
{
  "id": 1,
  "documentId": 1,
  "type": "SEQUENTIAL",
  "status": "PENDING",
  "initiatedBy": 1,
  "deadline": "2023-12-31T23:59:59.000Z",
  "createdAt": "2023-11-01T12:00:00.000Z",
  "updatedAt": "2023-11-01T12:00:00.000Z",
  "steps": [
    {
      "id": 1,
      "workflowId": 1,
      "approverId": 2,
      "order": 1,
      "status": "PENDING",
      "deadline": "2023-12-15T23:59:59.000Z",
      "createdAt": "2023-11-01T12:00:00.000Z",
      "updatedAt": "2023-11-01T12:00:00.000Z"
    },
    // ... other steps
  ]
}
```

**Frontend Implementation:**

```javascript
async function createWorkflow(workflowData) {
  try {
    const response = await axios.post('/approval-workflows', workflowData);
    return response.data;
  } catch (error) {
    console.error('Failed to create workflow:', error);
    throw error;
  }
}
```

### Get All Workflows

Returns all approval workflows where the current user is involved.

**Endpoint:** `GET /approval-workflows`

**Response:**

```json
[
  {
    "id": 1,
    "documentId": 1,
    "type": "SEQUENTIAL",
    "status": "IN_PROGRESS",
    "initiatedBy": 1,
    "deadline": "2023-12-31T23:59:59.000Z",
    "createdAt": "2023-11-01T12:00:00.000Z",
    "updatedAt": "2023-11-01T12:00:00.000Z",
    "document": {
      "id": 1,
      "title": "Project Proposal",
      "fileUrl": "https://example.com/documents/proposal.pdf"
    },
    "initiator": {
      "id": 1,
      "username": "john.doe",
      "email": "john.doe@example.com"
    },
    "steps": [
      // ... steps
    ]
  },
  // ... other workflows
]
```

**Frontend Implementation:**

```javascript
async function getAllWorkflows() {
  try {
    const response = await axios.get('/approval-workflows');
    return response.data;
  } catch (error) {
    console.error('Failed to get workflows:', error);
    throw error;
  }
}
```

### Get Workflow by ID

Returns the approval workflow with the specified ID.

**Endpoint:** `GET /approval-workflows/:id`

**Response:**

```json
{
  "id": 1,
  "documentId": 1,
  "type": "SEQUENTIAL",
  "status": "IN_PROGRESS",
  "initiatedBy": 1,
  "deadline": "2023-12-31T23:59:59.000Z",
  "createdAt": "2023-11-01T12:00:00.000Z",
  "updatedAt": "2023-11-01T12:00:00.000Z",
  "document": {
    "id": 1,
    "title": "Project Proposal",
    "fileUrl": "https://example.com/documents/proposal.pdf"
  },
  "initiator": {
    "id": 1,
    "username": "john.doe",
    "email": "john.doe@example.com"
  },
  "steps": [
    // ... steps
  ]
}
```

**Frontend Implementation:**

```javascript
async function getWorkflowById(id) {
  try {
    const response = await axios.get(`/approval-workflows/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to get workflow with ID ${id}:`, error);
    throw error;
  }
}
```

### Get Pending Approvals

Returns all pending approval steps assigned to the current user.

**Endpoint:** `GET /approval-workflows/pending`

**Response:**

```json
[
  {
    "id": 1,
    "workflowId": 1,
    "approverId": 2,
    "order": 1,
    "status": "PENDING",
    "deadline": "2023-12-15T23:59:59.000Z",
    "createdAt": "2023-11-01T12:00:00.000Z",
    "updatedAt": "2023-11-01T12:00:00.000Z",
    "workflow": {
      "id": 1,
      "documentId": 1,
      "type": "SEQUENTIAL",
      "status": "IN_PROGRESS",
      "document": {
        "id": 1,
        "title": "Project Proposal",
        "fileUrl": "https://example.com/documents/proposal.pdf"
      },
      "initiator": {
        "id": 1,
        "username": "john.doe",
        "email": "john.doe@example.com"
      },
      "steps": [
        // ... steps
      ]
    }
  },
  // ... other pending steps
]
```

**Frontend Implementation:**

```javascript
async function getPendingApprovals() {
  try {
    const response = await axios.get('/approval-workflows/pending');
    return response.data;
  } catch (error) {
    console.error('Failed to get pending approvals:', error);
    throw error;
  }
}
```

### Get Returned Steps

Returns all steps that were returned to the current user and need resubmission.

**Endpoint:** `GET /approval-workflows/returned-to-me`

**Response:**

```json
[
  {
    "stepId": 1,
    "workflowId": 1,
    "document": {
      "id": 1,
      "title": "Project Proposal"
    },
    "returnedAt": "2023-11-03T11:45:00.000Z",
    "returnReason": "Please update the financial data",
    "status": "RETURNED",
    "approver": {
      "id": 2,
      "username": "jane.smith",
      "email": "jane.smith@example.com"
    }
  },
  // ... other returned steps
]
```

**Frontend Implementation:**

```javascript
async function getReturnedSteps() {
  try {
    const response = await axios.get('/approval-workflows/returned-to-me');
    return response.data;
  } catch (error) {
    console.error('Failed to get returned steps:', error);
    throw error;
  }
}
```

### Update Step Status

Updates the status of an approval step (approve, reject, return, or resubmit).

**Endpoint:** `PATCH /approval-workflows/:workflowId/steps/:stepId`

**Request Body for Approving:**

```json
{
  "status": "APPROVED",
  "comment": "Looks good to me!"
}
```

**Request Body for Rejecting:**

```json
{
  "status": "REJECTED",
  "comment": "Cannot approve in current form",
  "rejectionReason": "Missing important information in section 3"
}
```

**Request Body for Returning:**

```json
{
  "status": "RETURNED",
  "comment": "Needs revision",
  "rejectionReason": "Please update the financial data",
  "returnToUserId": 2
}
```

**Request Body for Resubmitting:**

```json
{
  "status": "RESUBMITTED",
  "comment": "Updated as requested",
  "resubmissionExplanation": "Financial data has been updated with latest figures",
  "resubmitToUserId": 3
}
```

**Response:**

```json
{
  "id": 2,
  "workflowId": 1,
  "approverId": 3,
  "order": 2,
  "status": "RETURNED",
  "comment": "Needs revision",
  "rejectionReason": "Please update the financial data",
  "returnToStepId": 1,
  "completedAt": "2023-11-03T11:45:00.000Z",
  "createdAt": "2023-11-01T12:00:00.000Z",
  "updatedAt": "2023-11-03T11:45:00.000Z",
  "approver": {
    "id": 3,
    "username": "approver2",
    "email": "approver2@example.com"
  }
}
```

**Frontend Implementation:**

```javascript
async function updateStepStatus(workflowId, stepId, statusData) {
  try {
    const response = await axios.patch(`/approval-workflows/${workflowId}/steps/${stepId}`, statusData);
    return response.data;
  } catch (error) {
    console.error(`Failed to update step ${stepId} in workflow ${workflowId}:`, error);
    throw error;
  }
}
```

### Get Returnable Users

Returns the list of users who can receive a return from the current step.

**Endpoint:** `GET /approval-workflows/:workflowId/steps/:stepId/returnable-users`

**Response:**

```json
[
  {
    "id": 1,
    "approverId": 2,
    "approver": {
      "id": 2,
      "username": "jane.smith",
      "email": "jane.smith@example.com"
    },
    "order": 1
  },
  // ... other returnable users
]
```

**Frontend Implementation:**

```javascript
async function getReturnableUsers(workflowId, stepId) {
  try {
    const response = await axios.get(`/approval-workflows/${workflowId}/steps/${stepId}/returnable-users`);
    return response.data;
  } catch (error) {
    console.error(`Failed to get returnable users for step ${stepId} in workflow ${workflowId}:`, error);
    throw error;
  }
}
```

### Get Resubmission Target

Returns the user who returned this step (for resubmission).

**Endpoint:** `GET /approval-workflows/:workflowId/steps/:stepId/resubmission-target`

**Response:**

```json
{
  "id": 3,
  "username": "approver2",
  "email": "approver2@example.com"
}
```

**Frontend Implementation:**

```javascript
async function getResubmissionTarget(workflowId, stepId) {
  try {
    const response = await axios.get(`/approval-workflows/${workflowId}/steps/${stepId}/resubmission-target`);
    return response.data;
  } catch (error) {
    console.error(`Failed to get resubmission target for step ${stepId} in workflow ${workflowId}:`, error);
    throw error;
  }
}
```

### Get Return History

Returns the complete return/resubmission history for a workflow.

**Endpoint:** `GET /approval-workflows/:workflowId/return-history`

**Response:**

```json
[
  {
    "stepId": 2,
    "status": "RETURNED",
    "approver": {
      "id": 3,
      "username": "approver2",
      "email": "approver2@example.com"
    },
    "returnedAt": "2023-11-03T11:45:00.000Z",
    "returnReason": "Please update the financial data",
    "returnToStepId": 1,
    "returnToUser": {
      "id": 2,
      "username": "approver1",
      "email": "approver1@example.com"
    }
  },
  {
    "stepId": 1,
    "status": "RESUBMITTED",
    "approver": {
      "id": 2,
      "username": "approver1",
      "email": "approver1@example.com"
    },
    "returnedAt": "2023-11-04T09:30:00.000Z",
    "resubmissionExplanation": "Financial data has been updated with latest figures",
    "nextStepId": 2,
    "resubmitToUser": {
      "id": 3,
      "username": "approver2",
      "email": "approver2@example.com"
    }
  }
]
```

**Frontend Implementation:**

```javascript
async function getReturnHistory(workflowId) {
  try {
    const response = await axios.get(`/approval-workflows/${workflowId}/return-history`);
    return response.data;
  } catch (error) {
    console.error(`Failed to get return history for workflow ${workflowId}:`, error);
    throw error;
  }
}
```

## Error Handling

The API returns standard HTTP status codes to indicate the success or failure of a request:

- **200 OK**: The request was successful.
- **201 Created**: The resource was successfully created.
- **400 Bad Request**: The request was invalid or cannot be served. This occurs when the request contains invalid parameters or when a step is not in a valid state for the requested operation.
- **403 Forbidden**: The user does not have permission to perform the requested operation.
- **404 Not Found**: The requested resource does not exist.
- **500 Internal Server Error**: An error occurred on the server.

When an error occurs, the API returns a JSON response with an error message:

```json
{
  "statusCode": 400,
  "message": "Rejection reason is required when rejecting a step",
  "error": "Bad Request"
}
```

**Frontend Implementation:**

```javascript
async function makeApiRequest(url, method, data) {
  try {
    const response = await axios({
      url,
      method,
      data
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error:', error.response.data);
      
      // You can handle specific error codes here
      if (error.response.status === 403) {
        // Handle forbidden error (e.g., redirect to login page)
      } else if (error.response.status === 400) {
        // Handle bad request error (e.g., show validation errors)
      }
      
      throw error.response.data;
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Network Error:', error.request);
      throw new Error('Network error. Please check your connection.');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request Error:', error.message);
      throw error;
    }
  }
}
```

## Best Practices

1. **Authentication**: Always include the JWT token in the Authorization header of your requests.

2. **Error Handling**: Implement proper error handling to provide a good user experience when errors occur.

3. **Loading States**: Show loading indicators when making API requests to provide feedback to the user.

4. **Validation**: Validate user input on the frontend before sending it to the API to reduce unnecessary requests.

5. **Caching**: Consider caching responses for endpoints that don't change frequently, such as the list of returnable users.

6. **Refresh Tokens**: Implement refresh token functionality to maintain user sessions without requiring frequent logins.

7. **Polling**: For long-running operations, consider implementing polling to check the status of the operation.

## Common Scenarios

### Creating a New Workflow

1. Get the document ID for which you want to create a workflow.
2. Determine the workflow type (SEQUENTIAL or PARALLEL).
3. Select the approvers and define their order in the workflow.
4. Call the `POST /approval-workflows` endpoint with the required data.

### Approving a Step

1. Get the list of pending approvals for the current user.
2. Select the step to approve.
3. Call the `PATCH /approval-workflows/:workflowId/steps/:stepId` endpoint with the status set to "APPROVED".

### Returning a Step

1. Get the list of returnable users for the current step.
2. Select the user to return the step to.
3. Call the `PATCH /approval-workflows/:workflowId/steps/:stepId` endpoint with the status set to "RETURNED", providing the returnToUserId and rejectionReason.

### Resubmitting a Step

1. Get the list of returned steps for the current user.
2. Select the step to resubmit.
3. Get the resubmission target for the selected step.
4. Call the `PATCH /approval-workflows/:workflowId/steps/:stepId` endpoint with the status set to "RESUBMITTED", providing the resubmitToUserId and resubmissionExplanation.