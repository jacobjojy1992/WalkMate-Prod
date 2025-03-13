# WalkMate API Documentation

## Base URL
`http://localhost:3001/api`

## Response Format
All endpoints return responses in the following format:
```json
{
  "success": true|false,
  "data": [response data] | null,
  "error": [error message] | null
}



Authentication
This API does not currently implement authentication.
User Endpoints
1. Get All Users
Retrieves a list of all users.

URL: /users
Method: GET
URL Parameters: None
Success Response:

Code: 200
Content:
jsonCopy{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "User Name",
      "goalType": "steps",
      "goalValue": 10000,
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  ]
}



Error Response:

Code: 500
Content:
jsonCopy{
  "success": false,
  "error": "Failed to fetch users"
}




2. Get User by ID
Retrieves a single user by ID.

URL: /users/:id
Method: GET
URL Parameters:

id: User ID


Success Response:

Code: 200
Content:
jsonCopy{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "User Name",
    "goalType": "steps",
    "goalValue": 10000,
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}



Error Response:

Code: 404
Content:
jsonCopy{
  "success": false,
  "error": "User not found"
}




3. Create User
Creates a new user.

URL: /users
Method: POST
Data Parameters:

name (required): User's name
goalType (optional): Type of goal ("steps" or "distance")
goalValue (optional): Goal value (defaults to 10000)


Success Response:

Code: 201
Content:
jsonCopy{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "User Name",
    "goalType": "steps",
    "goalValue": 10000,
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}



Error Response:

Code: 400
Content:
jsonCopy{
  "success": false,
  "errors": ["name is required"]
}




4. Update User
Updates an existing user.

URL: /users/:id
Method: PUT
URL Parameters:

id: User ID


Data Parameters:

name (optional): User's name
goalType (optional): Type of goal
goalValue (optional): Goal value


Success Response:

Code: 200
Content:
jsonCopy{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Updated Name",
    "goalType": "steps",
    "goalValue": 12000,
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}



Error Response:

Code: 404
Content:
jsonCopy{
  "success": false,
  "error": "User not found"
}




5. Get User Streak
Gets the current streak (consecutive days with activity) for a user.

URL: /users/:id/streak
Method: GET
URL Parameters:

id: User ID


Success Response:

Code: 200
Content:
jsonCopy{
  "success": true,
  "data": {
    "streak": 5
  }
}



Error Response:

Code: 404
Content:
jsonCopy{
  "success": false,
  "error": "User not found"
}




6. Get Weekly Report
Gets a weekly activity report for a user.

URL: /users/:id/weekly-report
Method: GET
URL Parameters:

id: User ID


Query Parameters:

date (optional): Start date for the report (defaults to current week)


Success Response:

Code: 200
Content:
jsonCopy{
  "success": true,
  "data": {
    "startDate": "2023-03-05",
    "endDate": "2023-03-11",
    "dailyData": [
      {
        "date": "2023-03-05",
        "steps": 8000,
        "distance": 5.5,
        "duration": 60,
        "goalMet": false
      },
      // ... other days
    ],
    "weeklyTotals": {
      "totalSteps": 45000,
      "totalDistance": 30.5,
      "totalDuration": 300,
      "daysActive": 5,
      "daysGoalMet": 3
    }
  }
}



Error Response:

Code: 404
Content:
jsonCopy{
  "success": false,
  "error": "User not found"
}




Walk Endpoints
1. Get User Walks
Gets all walks for a user.

URL: /walks/user/:userId
Method: GET
URL Parameters:

userId: User ID


Success Response:

Code: 200
Content:
jsonCopy{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "steps": 5000,
      "distance": 3.5,
      "duration": 45,
      "date": "timestamp",
      "userId": "user-uuid",
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  ]
}



Error Response:

Code: 404
Content:
jsonCopy{
  "success": false,
  "error": "User not found"
}




2. Get Walks by Date
Gets all walks for a user on a specific date.

URL: /walks/user/:userId/date/:date
Method: GET
URL Parameters:

userId: User ID
date: Date in YYYY-MM-DD format


Success Response:

Code: 200
Content:
jsonCopy{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "steps": 5000,
      "distance": 3.5,
      "duration": 45,
      "date": "timestamp",
      "userId": "user-uuid",
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  ]
}



Error Response:

Code: 400
Content:
jsonCopy{
  "success": false,
  "error": "Invalid date format"
}




3. Create Walk
Creates a new walk activity.

URL: /walks
Method: POST
Data Parameters:

userId (required): User ID
steps (required): Number of steps
distance (required): Distance in kilometers
duration (required): Duration in minutes
date (required): Date and time of the walk


Success Response:

Code: 201
Content:
jsonCopy{
  "success": true,
  "data": {
    "id": "uuid",
    "steps": 5000,
    "distance": 3.5,
    "duration": 45,
    "date": "timestamp",
    "userId": "user-uuid",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}



Error Response:

Code: 404
Content:
jsonCopy{
  "success": false,
  "error": "User not found"
}




4. Update Walk
Updates an existing walk.

URL: /walks/:id
Method: PUT
URL Parameters:

id: Walk ID


Data Parameters:

steps (optional): Number of steps
distance (optional): Distance in kilometers
duration (optional): Duration in minutes
date (optional): Date and time of the walk


Success Response:

Code: 200
Content:
jsonCopy{
  "success": true,
  "data": {
    "id": "uuid",
    "steps": 6000,
    "distance": 4.2,
    "duration": 50,
    "date": "timestamp",
    "userId": "user-uuid",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}



Error Response:

Code: 404
Content:
jsonCopy{
  "success": false,
  "error": "Walk not found"
}




5. Delete Walk
Deletes a walk.

URL: /walks/:id
Method: DELETE
URL Parameters:

id: Walk ID


Success Response:

Code: 200
Content:
jsonCopy{
  "success": true,
  "message": "Walk deleted successfully"
}



Error Response:

Code: 404
Content:
jsonCopy{
  "success": false,
  "error": "Walk not found"
}




6. Get Walk Statistics
Gets walking statistics for a user.

URL: /walks/user/:userId/stats
Method: GET
URL Parameters:

userId: User ID


Query Parameters:

period (optional): "week" or "month"
startDate (optional): Start date for custom period
endDate (optional): End date for custom period


Success Response:

Code: 200
Content:
jsonCopy{
  "success": true,
  "data": {
    "totalWalks": 10,
    "totalSteps": 50000,
    "totalDistance": 35.5,
    "totalDuration": 450,
    "averageStepsPerWalk": 5000,
    "averageDistancePerWalk": 3.55,
    "averageDurationPerWalk": 45,
    "startDate": "2023-03-05",
    "endDate": "2023-03-11"
  }
}



Error Response:

Code: 404
Content:
jsonCopy{
  "success": false,
  "error": "User not found"
}




Health Check Endpoint
Get API Health
Checks if the API server is running.

URL: /health
Method: GET
Success Response:

Code: 200
Content:
jsonCopy{
  "status": "ok",
  "message": "Server is running"
}




You can copy everything between the triple backticks above (not including the backticks themselves) and paste it directly into your APIdoc.md file. This is a complete, properly formatted Markdown document that documents all of your API endpoints in a standard, best-practice format.

This documentation format is widely used in the industry because it:

1. Clearly describes each endpoint's URL, method, and parameters
2. Shows example request and response formats
3. Documents both success and error cases
4. Uses markdown formatting for readability
5. Can be easily rendered on GitHub or other platforms that support Markdown

When viewed in a Markdown renderer (like GitHub or VS Code's preview), this will display as a nicely formatted API documentation with proper headings, code blocks, and structure.

