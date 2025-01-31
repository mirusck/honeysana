import { Handler } from "aws-lambda";
import axios from "axios";

// Configuration constants
const HONEYBADGER_API_TOKEN = process.env.HONEYBADGER_API_TOKEN || "";
const HONEYBADGER_PROJECT_ID = process.env.HONEYBADGER_PROJECT_ID || "";
const ASANA_ACCESS_TOKEN = process.env.ASANA_ACCESS_TOKEN || "";
const ASANA_WORKSPACE_ID = process.env.ASANA_WORKSPACE_ID || "";
const ASANA_PROJECT_ID = process.env.ASANA_PROJECT_ID || "";
const ASANA_SECTION_ID = process.env.ASANA_SECTION_ID || "";
const HONEYBADGER_ASSIGNED_USER_ID =
  process.env.HONEYBADGER_ASSIGNED_USER_ID || "";

// Interfaces
interface HoneybadgerFault {
  id: number;
  message: string;
  klass: string;
  created_at: string;
  environment: string;
  url: string;
}

export const handler: Handler = async (event, context) => {
  try {
    // Get unassigned faults from Honeybadger
    const response = await axios.get(
      `https://app.honeybadger.io/v2/projects/${HONEYBADGER_PROJECT_ID}/faults`,
      {
        params: {
          q: "-is:resolved -is:ignored -is:assigned",
        },
        auth: {
          username: HONEYBADGER_API_TOKEN,
          password: "",
        },
      }
    );

    const faults: HoneybadgerFault[] = response.data["results"];

    // Create tickets for each fault
    for (const fault of faults) {
      // Create ticket in Asana
      const response = await axios.post(
        "https://app.asana.com/api/1.0/tasks",
        {
          data: {
            workspace: ASANA_WORKSPACE_ID,
            name: `${fault.environment?.toUpperCase()} > Honeybadger Error: ${
              fault.klass
            }`,
            notes: `
          Error Message: ${fault.message}
          Created At: ${
            fault.created_at ? new Date(fault.created_at).toUTCString() : "n/a"
          }
          Environment: ${fault.environment}
          Fault ID: ${fault.id}
          Link: ${fault.url}
        `,
            projects: [ASANA_PROJECT_ID],
            memberships: [
              {
                project: ASANA_PROJECT_ID,
                section: ASANA_SECTION_ID,
              },
            ],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${ASANA_ACCESS_TOKEN}`,
            "Content-type": "application/json",
          },
        }
      );

      // Assign fault to user in Honeybadger
      await axios.put(
        `https://app.honeybadger.io/v2/projects/${HONEYBADGER_PROJECT_ID}/faults/${fault.id}`,
        {
          fault: {
            assignee_id: HONEYBADGER_ASSIGNED_USER_ID,
          },
        },
        {
          auth: {
            username: HONEYBADGER_API_TOKEN,
            password: "",
          },
        }
      );
    }

    console.info(`Successfully processed ${faults.length} Honeybadger faults`);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Successfully processed ${faults.length} Honeybadger faults`,
      }),
    };
  } catch (error) {
    console.error("Error processing Honeybadger faults:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error processing Honeybadger faults",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
