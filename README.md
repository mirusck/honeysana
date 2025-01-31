# Honeybadger-Asana Integration

AWS Lambda function that automatically creates Asana tasks from Honeybadger errors.

## Prerequisites

- Node.js (version 22.x)
- PNPM
- AWS CLI configured with appropriate credentials
- Serverless Framework

## Serverless Setup

1. Install Serverless Framework globally:
```bash
npm install -g serverless
```

2. Run interactive setup:
```bash
serverless
```
This will guide you through:
- Creating an AWS account if you don't have one
- Creating proper IAM user with required permissions
- Setting up credentials

3. Verify setup:
```bash
serverless --version
```

4. Create `.env` file from example:
```bash
cp .env.example .env
```

5. Fill in environment variables in `.env`:
```env
HONEYBADGER_API_TOKEN=your_honeybadger_api_token
HONEYBADGER_PROJECT_ID=your_honeybadger_project_id
HONEYBADGER_ASSIGNED_USER_ID=your_honeybadger_user_id
ASANA_ACCESS_TOKEN=your_asana_access_token
ASANA_WORKSPACE_ID=your_workspace_id
ASANA_ASSIGNEE_ID=your_asana_user_id
ASANA_PROJECT_ID=your_project_id
ASANA_SECTION_ID=your_section_id
```

Now you can deploy using:
```bash
pnpm run deploy
```

## Deployment

1. Ensure AWS CLI is configured correctly:
```bash
aws configure
```

2. Deploy the function:
```bash
pnpm run deploy
```

## Development

### Running Tests
```bash
pnpm test
```

### Local Development
For local testing of the function use:
```bash
pnpm run dev
```

## Monitoring

After deployment, you can view logs through AWS CloudWatch:
```bash
serverless logs --function processHoneybadgerFaults
```

## Project Structure

```
.
├── index.ts              # Main file with Lambda function
├── serverless.yml        # Serverless Framework configuration
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── jest.config.ts        # Test configuration
└── .env                  # Environment variables (not in repository)
```

## Security

- Never commit `.env` file to repository
- Keep dependencies up to date

## Features

- Automatically creates Asana tasks from Honeybadger errors
- Runs on schedule (Mon-Fri, 8:00-19:00 Kyiv time)
- Includes error details and environment info in task description
- Creates tasks in specified Asana section
- Updates Honeybadger fault assignment

## Configuration Options

You can modify the following in `serverless.yml`:
- Function schedule (default: 15 minutes)
- Memory allocation (default: 512MB)
- Timeout (default: 60 seconds)
- Region (default: us-east-2)

## Configuration

### Getting Credentials

#### Honeybadger API Token
1. Log in to [Honeybadger](https://app.honeybadger.io)
2. Go to User Settings → Authentication → Your Honeybadger API Token
3. Copy the API token for your project

#### Asana Access Token
1. Visit [Asana Developer Console](https://app.asana.com/0/developer-console)
2. Click "New access token"
3. Name your token and create it
4. Copy the token immediately (you won't be able to see it again)

#### Asana Workspace ID
1. Open this URL in your browser: https://app.asana.com/api/1.0/workspaces
   (make sure you're logged in to Asana)
2. Find your workspace in the response and copy its `gid` value:
```json
{
  "data": [
    {
      "gid": "1234567890123456",  // This is your workspace ID
      "name": "Your Workspace Name",
      ...
    }
  ]
}
```

#### Asana Project ID
1. Open this URL in your browser: https://app.asana.com/api/1.0/projects
   (make sure you're logged in to Asana)
2. Find your project in the response and copy its `gid` value:
```json
{
  "data": [
    {
      "gid": "1234567890123456",  // This is your project ID
      "name": "Your Project Name",
      ...
    }
  ]
}
```

#### Asana Section ID
1. Open this URL in your browser: https://app.asana.com/api/1.0/projects/YOUR_PROJECT_ID/sections
   (replace YOUR_PROJECT_ID with your project's ID from the previous step)
2. Find your section in the response and copy its `gid` value:
```json
{
  "data": [
    {
      "gid": "1234567890123456",  // This is your section ID
      "name": "Your Section Name",
      ...
    }
  ]
}
```

#### Asana Assignee ID
1. Open this URL in your browser: https://app.asana.com/api/1.0/users
   (make sure you're logged in to Asana)
2. Find yourself in the response and copy your `gid` value:
```json
{
  "data": [
    {
      "gid": "1234567890123456",  // This is your user ID
      "name": "Your Name",
      ...
    }
  ]
}
```

#### Honeybadger Project ID
1. Open your project in Honeybadger
2. The project ID is in the URL:
```
https://app.honeybadger.io/projects/12345
                                  ^^^^^
                                  This is your project ID
```

#### Honeybadger Assigned User ID
1. Open any fault in Honeybadger
2. Click "Assign" button
3. Right-click on your name in the dropdown
4. Select "Inspect" in browser developer tools
5. Find your ID in the `data-params` attribute:
```html
data-params="fault[assignee_id]=111091"
                                ^^^^^
                                This is your user ID
```

After getting all the values, update your `.env`