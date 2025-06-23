# Department Hierarchy Documentation

## Overview

The DocFlow application supports a hierarchical structure for departments, allowing organizations to model their organizational chart. This document explains how the department hierarchy works and how to use the API endpoints to manage and visualize it.

## Department Hierarchy Structure

Departments in DocFlow can have parent-child relationships, creating a tree-like structure:

- A department can have one parent department
- A department can have multiple child departments
- Departments without a parent are considered root departments (e.g., the Rector's office in a university)
- Users are assigned to specific departments

## API Endpoints

### Managing Departments

- `POST /departments` - Create a new department
  - Include `parentId` in the request body to set a parent department
  
- `GET /departments` - Get all departments
  - Returns a flat list of all departments with basic parent/child information
  
- `GET /departments/:id` - Get a specific department by ID
  - Returns detailed information about a department, including its parent and children
  
- `PATCH /departments/:id` - Update a department
  - Can update the `parentId` to move a department in the hierarchy
  
- `DELETE /departments/:id` - Delete a department
  - Cannot delete departments with assigned users

### Department Hierarchy

- `GET /departments/hierarchy` - Get the complete department hierarchy
  - Returns a tree structure with root departments at the top level
  - Each department includes its child departments recursively
  
- `GET /departments/hierarchy/chart` - Get the department hierarchy formatted for chart visualization
  - Returns a specially formatted hierarchy suitable for chart visualization
  - Includes metadata like total departments, maximum depth, and total users
  - Designed to be easily consumed by charting libraries

### User Management in Departments

- `POST /departments/:id/users` - Assign a user to a department
- `DELETE /departments/users/:id` - Remove a user from their department
- `GET /departments/:id/users` - Get all users in a specific department
- `GET /departments/:id/users/hierarchy` - Get all users in a department and its child departments

## Visualizing the Department Hierarchy

The `/departments/hierarchy/chart` endpoint provides data specifically formatted for chart visualization. The response includes:

```json
{
  "chartData": [
    {
      "id": 1,
      "name": "Rector's Office",
      "description": "University leadership",
      "userCount": 5,
      "level": 0,
      "parentId": null,
      "children": [
        {
          "id": 2,
          "name": "Finance Department",
          "description": "Handles financial operations",
          "userCount": 10,
          "level": 1,
          "parentId": 1,
          "children": [
            {
              "id": 3,
              "name": "IT Department",
              "description": "Technical support",
              "userCount": 15,
              "level": 2,
              "parentId": 2,
              "children": []
            }
          ]
        }
      ]
    }
  ],
  "totalDepartments": 3,
  "maxDepth": 2,
  "totalUsers": 30
}
```

This data can be used with various charting libraries to create organizational charts, tree diagrams, or other hierarchical visualizations.

## Example: Creating a Department Hierarchy

1. Create the root department (e.g., Rector's Office):
   ```json
   POST /departments
   {
     "name": "Rector's Office",
     "description": "University leadership"
   }
   ```

2. Create a child department (e.g., Finance Department):
   ```json
   POST /departments
   {
     "name": "Finance Department",
     "description": "Handles financial operations",
     "parentId": 1
   }
   ```

3. Create a sub-department (e.g., IT Department):
   ```json
   POST /departments
   {
     "name": "IT Department",
     "description": "Technical support",
     "parentId": 2
   }
   ```

4. Visualize the hierarchy:
   ```
   GET /departments/hierarchy/chart
   ```

## Best Practices

1. **Plan your hierarchy** - Design your department structure before implementing it
2. **Avoid deep nesting** - Keep the hierarchy relatively flat for better performance
3. **Use meaningful names** - Department names should be clear and descriptive
4. **Consider user assignments** - Assign users to the most specific department possible
5. **Regularly review** - Periodically review and update the department structure as your organization evolves