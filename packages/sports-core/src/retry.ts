export async function withRetry<T>(
  operation: () => Promise<T>,
  options: { maxRetries: number; backoffMs: number },
): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= options.maxRetries) throw error;
      const delay = options.backoffMs * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
      attempt += 1;
    }
  }
}
