# Document Return and Resubmission Guide

This guide explains how to return a document to a previous approver and how to resubmit a document after it has been returned in the approval workflow system.

## Returning a Document to a Previous Approver

When you need to return a document to a previous approver for corrections or additional review, follow these steps:

### Step 1: Identify the Document and Step

First, identify the workflow ID and step ID of the document you want to return. You can find this information in your pending approvals list.

### Step 2: Get Previous Users

Before returning a document, you may want to see the list of previous users you can return the document to:

```
GET /approval-workflows/{workflowId}/steps/{stepId}/previous-users
```

Example:
```
GET /approval-workflows/12/steps/25/previous-users
```

This will return a list of previous users in the workflow that you can select when returning a document.

### Step 3: Return the Document

To return a document to a previous approver, make a PATCH request to update the step status:

```
PATCH /approval-workflows/{workflowId}/steps/{stepId}
```

Request body:
```json
{
  "status": "RETURNED",
  "comment": "Please make the following corrections",
  "rejectionReason": "Document is incomplete and needs additional information",
  "returnToStepId": 24
}
```

Parameters:
- `status`: Must be set to "RETURNED"
- `comment`: Optional comment explaining your decision
- `rejectionReason`: Required explanation of why you're returning the document
- `returnToStepId`: Required ID of the step you're returning the document to

Example:
```
PATCH /approval-workflows/12/steps/25
```

## Resubmitting a Document After Return

When a document has been returned to you for corrections, you'll need to resubmit it after making the necessary changes:

### Step 1: View Returned Documents

Returned documents will appear in your "Returned" tab in the dashboard.

### Step 2: Make Corrections

Open the returned document, review the return reason, and make the necessary corrections to the document.

### Step 3: Resubmit the Document

To resubmit the document, make a PATCH request to update the step status:

```
PATCH /approval-workflows/{workflowId}/steps/{stepId}
```

Request body:
```json
{
  "status": "RESUBMITTED",
  "comment": "I've made the requested changes",
  "resubmissionExplanation": "Added the missing information and corrected the formatting",
  "nextStepId": 25
}
```

Parameters:
- `status`: Must be set to "RESUBMITTED"
- `comment`: Optional general comment
- `resubmissionExplanation`: Required explanation of what corrections were made
- `nextStepId`: Required ID of the step to send the document to next

Example:
```
PATCH /approval-workflows/12/steps/24
```

## Workflow Status After Return/Resubmit

- When a document is returned, the workflow status changes to "IN_PROGRESS"
- The step that was returned to will have its status reset to "PENDING"
- When a document is resubmitted, the workflow status remains "IN_PROGRESS"
- The next step specified in the resubmission will have its status set to "PENDING"

## Important Notes

1. You can only return a document to a previous step in the workflow
2. When resubmitting, you can only send the document to a step with a higher order than your current step
3. All actions (return, resubmit) are recorded in the workflow history with timestamps
4. Notifications are sent to relevant users when documents are returned or resubmitted

## API Reference

For complete API documentation, refer to the Swagger documentation at `/api`.