export interface ParsedApiError {
  statusCode: number;
  message: string;
  errors?: string[];
  raw?: unknown;
}

export function parseApiError(err: unknown, fallbackMessage = ''): ParsedApiError {
  if (!err || typeof err !== 'object') {
    return {
      statusCode: 500,
      message: typeof err === 'string' ? err : fallbackMessage,
    };
  }

  const axiosErr = err as {
    response?: {
      status?: number;
      data?: {
        message?: string | string[];
        error?: string;
        statusCode?: number;
      };
    };
    message?: string;
  };

  const status = axiosErr.response?.status ?? 500;
  const data = axiosErr.response?.data;

  if (data?.message) {
    if (Array.isArray(data.message)) {
      return {
        statusCode: status,
        message: data.message.join(', '),
        errors: data.message,
        raw: data,
      };
    }
    return {
      statusCode: status,
      message: data.message,
      raw: data,
    };
  }

  if (axiosErr.message) {
    return {
      statusCode: status,
      message: axiosErr.message,
      raw: err,
    };
  }

  return {
    statusCode: status,
    message: fallbackMessage,
    raw: err,
  };
}
