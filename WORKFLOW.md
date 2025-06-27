# Document Approval Workflow Process

This document provides a comprehensive guide to the document approval workflow process in the DocFlow system. It explains the workflow types, step-by-step processes, API endpoints, and status transitions.

## Table of Contents

1. [Overview](#overview)
2. [Workflow Types](#workflow-types)
3. [Step Statuses](#step-statuses)
4. [Workflow Process](#workflow-process)
   - [Creating a Workflow](#creating-a-workflow)
   - [Approving a Step](#approving-a-step)
   - [Rejecting a Step](#rejecting-a-step)
   - [Returning a Step](#returning-a-step)
   - [Resubmitting a Step](#resubmitting-a-step)
5. [API Endpoints](#api-endpoints)
6. [Example Requests and Responses](#example-requests-and-responses)

## Overview

The document approval workflow system allows users to create approval processes for documents. Documents can be routed through a series of approvers in either a sequential or parallel manner. Approvers can approve, reject, return, or request resubmission of documents.

## Workflow Types

The system supports several types of workflows:

- **SEQUENTIAL**: Approvers review the document one after another in a predefined order. Each step must be completed before the next one begins.
- **PARALLEL**: All approvers can review the document simultaneously. The workflow is considered complete when all approvers have responded.
- **AGREEMENT**: Similar to SEQUENTIAL but with specific agreement-related features.
- **SIGNATURE**: A workflow specifically designed for document signing processes.

## Step Statuses

Each step in a workflow can have one of the following statuses:

- **PENDING**: The step is waiting for the approver's action.
- **APPROVED**: The approver has approved the step.
- **REJECTED**: The approver has rejected the step, which typically ends the workflow.
- **RETURNED**: The approver has returned the step to a previous approver for revision.
- **RESUBMITTED**: A previously returned step has been corrected and resubmitted.

## Workflow Process

### Creating a Workflow

1. A user (initiator) creates a new workflow for a document.
2. The initiator specifies the workflow type (SEQUENTIAL or PARALLEL).
3. The initiator adds approvers and defines their order in the workflow.
4. The system creates the workflow and sets the status of the first step(s) to PENDING.
5. Approvers are notified of pending approvals.

### Approving a Step

1. An approver reviews a document assigned to them.
2. If satisfied, the approver marks the step as APPROVED.
3. For SEQUENTIAL workflows:
   - If this is the last step, the workflow is marked as completed.
   - If not, the next step becomes PENDING.
4. For PARALLEL workflows:
   - If all steps are now APPROVED, the workflow is marked as completed.

### Rejecting a Step

1. An approver reviews a document assigned to them.
2. If not satisfied, the approver marks the step as REJECTED and provides a reason.
3. The workflow is marked as REJECTED.
4. The initiator and all approvers are notified.

### Returning a Step

1. An approver reviews a document assigned to them.
2. If revisions are needed, the approver can return the document to a previous approver.
3. The approver marks the step as RETURNED, specifies the return recipient, and provides a reason.
4. The system resets the status of the returned step to PENDING.
5. The workflow status is updated to RETURNED.
6. The return recipient is notified.

### Resubmitting a Step

1. An approver who received a returned document makes the necessary revisions.
2. The approver marks their step as RESUBMITTED, specifies the next approver, and provides an explanation.
3. The system updates the next step to PENDING.
4. The workflow status is updated to IN_PROGRESS.
5. The next approver is notified.

## API Endpoints

### Create a Workflow

```
POST /approval-workflows
```

Creates a new approval workflow for a document.

### Get All Workflows

```
GET /approval-workflows
```

Returns all approval workflows where the current user is involved.

### Get Pending Approvals

```
GET /approval-workflows/pending
```

Returns all pending approval steps assigned to the current user.

### Get Returned Steps

```
GET /approval-workflows/returned-to-me
```

Returns all steps that were returned to the current user and need resubmission.

### Check Overdue Steps

```
GET /approval-workflows/check-overdue
```

Checks for overdue steps and workflows and updates their status.

### Get Returnable Users

```
GET /approval-workflows/:workflowId/steps/:stepId/returnable-users
```

Returns the list of users who can receive a return from the current step.

### Get Resubmission Target

```
GET /approval-workflows/:workflowId/steps/:stepId/resubmission-target
```

Returns the user who returned this step (for resubmission).

### Get Return History

```
GET /approval-workflows/:workflowId/return-history
```

Returns the complete return/resubmission history for a workflow.

### Get Workflow by ID

```
GET /approval-workflows/:id
```

Returns the approval workflow with the specified ID.

### Update Step Status

```
PATCH /approval-workflows/:workflowId/steps/:stepId
```

Updates the status of an approval step (approve, reject, return, or resubmit).

## Example Requests and Responses

### Creating a Workflow

**Request:**

```json
POST /approval-workflows
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
    {
      "id": 2,
      "workflowId": 1,
      "approverId": 3,
      "order": 2,
      "status": "PENDING",
      "deadline": "2023-12-20T23:59:59.000Z",
      "createdAt": "2023-11-01T12:00:00.000Z",
      "updatedAt": "2023-11-01T12:00:00.000Z"
    },
    {
      "id": 3,
      "workflowId": 1,
      "approverId": 4,
      "order": 3,
      "status": "PENDING",
      "deadline": "2023-12-25T23:59:59.000Z",
      "createdAt": "2023-11-01T12:00:00.000Z",
      "updatedAt": "2023-11-01T12:00:00.000Z"
    }
  ]
}
```

### Approving a Step

**Request:**

```json
PATCH /approval-workflows/1/steps/1
{
  "status": "APPROVED",
  "comment": "Looks good to me!"
}
```

**Response:**

```json
{
  "id": 1,
  "workflowId": 1,
  "approverId": 2,
  "order": 1,
  "status": "APPROVED",
  "comment": "Looks good to me!",
  "completedAt": "2023-11-02T14:30:00.000Z",
  "createdAt": "2023-11-01T12:00:00.000Z",
  "updatedAt": "2023-11-02T14:30:00.000Z",
  "approver": {
    "id": 2,
    "username": "approver1",
    "email": "approver1@example.com"
  }
}
```

### Rejecting a Step

**Request:**

```json
PATCH /approval-workflows/1/steps/2
{
  "status": "REJECTED",
  "comment": "Cannot approve in current form",
  "rejectionReason": "Missing important information in section 3"
}
```

**Response:**

```json
{
  "id": 2,
  "workflowId": 1,
  "approverId": 3,
  "order": 2,
  "status": "REJECTED",
  "comment": "Cannot approve in current form",
  "rejectionReason": "Missing important information in section 3",
  "completedAt": "2023-11-03T10:15:00.000Z",
  "createdAt": "2023-11-01T12:00:00.000Z",
  "updatedAt": "2023-11-03T10:15:00.000Z",
  "approver": {
    "id": 3,
    "username": "approver2",
    "email": "approver2@example.com"
  }
}
```

### Returning a Step

**Request:**

```json
PATCH /approval-workflows/1/steps/2
{
  "status": "RETURNED",
  "comment": "Needs revision",
  "rejectionReason": "Please update the financial data",
  "returnToUserId": 2
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

### Resubmitting a Step

**Request:**

```json
PATCH /approval-workflows/1/steps/1
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
  "id": 1,
  "workflowId": 1,
  "approverId": 2,
  "order": 1,
  "status": "RESUBMITTED",
  "comment": "Updated as requested",
  "resubmissionExplanation": "Financial data has been updated with latest figures",
  "nextStepId": 2,
  "completedAt": "2023-11-04T09:30:00.000Z",
  "createdAt": "2023-11-01T12:00:00.000Z",
  "updatedAt": "2023-11-04T09:30:00.000Z",
  "approver": {
    "id": 2,
    "username": "approver1",
    "email": "approver1@example.com"
  }
}
```