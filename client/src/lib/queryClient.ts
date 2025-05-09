import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    
    try {
      // Try to parse the error as JSON
      const errorJson = JSON.parse(text);
      
      // Handle validation errors (like Zod errors)
      if (errorJson.error && Array.isArray(errorJson.error)) {
        const validationErrors = errorJson.error
          .map((err: any) => {
            if (err.path && err.message) {
              return `${err.path.join('.')}: ${err.message}`;
            }
            return err.message || JSON.stringify(err);
          })
          .join('; ');
        
        throw new Error(`Validation error: ${validationErrors}`);
      }
      
      // Handle other JSON errors
      if (errorJson.error) {
        throw new Error(typeof errorJson.error === 'string' 
          ? errorJson.error 
          : JSON.stringify(errorJson.error));
      }
      
      throw new Error(JSON.stringify(errorJson));
    } catch (e) {
      // If not JSON or other error in parsing, use the text
      if (e instanceof SyntaxError) {
        throw new Error(`${res.status}: ${text || res.statusText}`);
      }
      throw e; // Rethrow if it's our custom error
    }
  }
}

export async function apiRequest<T>(
  url: string,
  options: {
    method: string;
    body?: any;
  }
): Promise<T> {
  const res = await fetch(url, {
    method: options.method,
    headers: options.body ? { "Content-Type": "application/json" } : {},
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  const data = await res.json();
  return data as T;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
