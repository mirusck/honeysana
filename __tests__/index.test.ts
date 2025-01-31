import { handler } from "../index";
import axios from "axios";
import { Context } from "aws-lambda";

// Mock external dependencies
jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("Honeybadger-Asana Integration Lambda", () => {
  const mockContext: Context = {
    callbackWaitsForEmptyEventLoop: true,
    functionName: "test",
    functionVersion: "1",
    invokedFunctionArn: "test",
    memoryLimitInMB: "128",
    awsRequestId: "test",
    logGroupName: "test",
    logStreamName: "test",
    getRemainingTimeInMillis: () => 1000,
    done: () => {},
    fail: () => {},
    succeed: () => {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully process faults and create Asana tasks", async () => {
    const mockFaults = [
      {
        id: 123,
        message: "Test error message",
        error_class: "TestError",
        created_at: "2024-01-01T00:00:00Z",
        environment: "production",
      },
    ];

    mockedAxios.get.mockResolvedValueOnce({ data: { results: mockFaults } });
    mockedAxios.post.mockResolvedValueOnce({ data: { gid: "task_123" } });
    mockedAxios.put.mockResolvedValueOnce({ data: { success: true } });

    const result = await handler({}, mockContext, () => {});

    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify({
        message: "Successfully processed 1 Honeybadger faults",
      }),
    });
  });

  it("should handle Asana API errors", async () => {
    const mockFaults = [
      {
        id: 123,
        message: "Test error",
        error_class: "TestError",
        created_at: "2024-01-01T00:00:00Z",
        environment: "production",
      },
    ];

    mockedAxios.get.mockResolvedValueOnce({ data: { results: mockFaults } });
    mockedAxios.post.mockRejectedValueOnce(new Error("Asana API error"));

    const result = await handler({}, mockContext, () => {});

    expect(result).toEqual({
      statusCode: 500,
      body: JSON.stringify({
        message: "Error processing Honeybadger faults",
        error: "Asana API error",
      }),
    });
  });

  it("should handle Honeybadger API errors", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error("Honeybadger API error"));

    const result = await handler({}, mockContext, () => {});

    expect(result).toEqual({
      statusCode: 500,
      body: JSON.stringify({
        message: "Error processing Honeybadger faults",
        error: "Honeybadger API error",
      }),
    });
  });

  it("should handle empty response from Honeybadger", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { results: [] } });

    const result = await handler({}, mockContext, () => {});

    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify({
        message: "Successfully processed 0 Honeybadger faults",
      }),
    });
  });
});
