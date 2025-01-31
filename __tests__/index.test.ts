import { handler } from "../index";
import axios from "axios";
import { Context } from "aws-lambda";

// Mock axios first
jest.mock("axios", () => {
  const mockGet = jest.fn();
  const mockPost = jest.fn();
  const mockPut = jest.fn();

  return {
    create: jest.fn(() => ({
      get: mockGet,
      post: mockPost,
      put: mockPut,
    })),
  };
});

// Get mock functions after mocking
const mockAxiosInstance = (axios.create as jest.Mock)();
const mockAxiosGet = mockAxiosInstance.get as jest.Mock;
const mockAxiosPost = mockAxiosInstance.post as jest.Mock;
const mockAxiosPut = mockAxiosInstance.put as jest.Mock;

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
    const mockFaults = {
      results: [{
        id: 123,
        message: 'Test error message',
        klass: 'TestError',
        created_at: '2024-01-01T00:00:00Z',
        environment: 'production',
        url: 'https://app.honeybadger.io/fault/123',
      }]
    };

    mockAxiosGet.mockResolvedValueOnce({ data: mockFaults });
    mockAxiosPost.mockResolvedValueOnce({ data: { gid: 'task_123' } });
    mockAxiosPut.mockResolvedValueOnce({ data: { success: true } });

    const result = await handler({}, mockContext, () => {});

    expect(mockAxiosGet).toHaveBeenCalledWith('/faults', {
      params: { q: '-is:resolved -is:ignored -is:assigned' },
    });

    expect(mockAxiosPost).toHaveBeenCalledWith('/tasks', {
      data: expect.objectContaining({
        name: expect.stringContaining('PRODUCTION > Honeybadger Error: TestError'),
      }),
    });

    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify({
        message: 'Successfully processed 1 Honeybadger faults',
      }),
    });
  });

  it("should handle Asana API errors", async () => {
    const mockFaults = {
      results: [{
        id: 123,
        message: 'Test error',
        klass: 'TestError',
        created_at: '2024-01-01T00:00:00Z',
        environment: 'production',
        url: 'https://app.honeybadger.io/fault/123',
      }]
    };

    mockAxiosGet.mockResolvedValueOnce({ data: mockFaults });
    mockAxiosPost.mockRejectedValueOnce(new Error('Asana API error'));

    const result = await handler({}, mockContext, () => {});

    expect(result).toEqual({
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error processing Honeybadger faults',
        error: 'Asana API error',
      }),
    });
  });

  it("should handle Honeybadger API errors", async () => {
    mockAxiosGet.mockRejectedValueOnce(new Error('Honeybadger API error'));

    const result = await handler({}, mockContext, () => {});

    expect(result).toEqual({
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error processing Honeybadger faults',
        error: 'Honeybadger API error',
      }),
    });
  });

  it("should handle empty response from Honeybadger", async () => {
    mockAxiosGet.mockResolvedValueOnce({ data: { results: [] } });

    const result = await handler({}, mockContext, () => {});

    expect(result).toEqual({
      statusCode: 200,
      body: JSON.stringify({
        message: 'Successfully processed 0 Honeybadger faults',
      }),
    });
  });
});
