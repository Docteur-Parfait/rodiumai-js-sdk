export interface UsageData {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokens: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  averageLatencyMs: number;
  errorRate: number;
  requestsByModel: Record<string, number>;
  requestsByEndpoint: Record<string, number>;
}

export class UsageStats {
  totalRequests = 0;
  successfulRequests = 0;
  failedRequests = 0;
  totalTokens = 0;
  totalPromptTokens = 0;
  totalCompletionTokens = 0;
  totalLatencyMs = 0;
  requestsByModel: Record<string, number> = {};
  requestsByEndpoint: Record<string, number> = {};
  private consecutiveErrors = 0;
  private lastErrors: number[] = [];

  get averageLatencyMs(): number {
    if (this.totalRequests === 0) return 0;
    return Math.round((this.totalLatencyMs / this.totalRequests) * 100) / 100;
  }

  get errorRate(): number {
    if (this.totalRequests === 0) return 0;
    return Math.round((this.failedRequests / this.totalRequests) * 1000) / 1000;
  }

  get recentErrorRate(): number {
    if (this.lastErrors.length === 0) return 0;
    return this.lastErrors.reduce((a, b) => a + b, 0) / this.lastErrors.length;
  }

  get consecutiveErrorCount(): number {
    return this.consecutiveErrors;
  }

  recordRequest({
    success,
    model,
    endpoint,
    latencyMs,
    promptTokens = 0,
    completionTokens = 0,
  }: {
    success: boolean;
    model: string;
    endpoint: string;
    latencyMs: number;
    promptTokens?: number;
    completionTokens?: number;
  }): void {
    this.totalRequests++;
    if (success) {
      this.successfulRequests++;
      this.consecutiveErrors = 0;
    } else {
      this.failedRequests++;
      this.consecutiveErrors++;
    }

    this.totalTokens += promptTokens + completionTokens;
    this.totalPromptTokens += promptTokens;
    this.totalCompletionTokens += completionTokens;
    this.totalLatencyMs += latencyMs;

    this.requestsByModel[model] = (this.requestsByModel[model] ?? 0) + 1;
    this.requestsByEndpoint[endpoint] = (this.requestsByEndpoint[endpoint] ?? 0) + 1;

    this.lastErrors.push(success ? 0 : 1);
    if (this.lastErrors.length > 10) {
      this.lastErrors.shift();
    }
  }

  toJSON(): UsageData {
    return {
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      totalTokens: this.totalTokens,
      totalPromptTokens: this.totalPromptTokens,
      totalCompletionTokens: this.totalCompletionTokens,
      averageLatencyMs: this.averageLatencyMs,
      errorRate: this.errorRate,
      requestsByModel: { ...this.requestsByModel },
      requestsByEndpoint: { ...this.requestsByEndpoint },
    };
  }

  reset(): void {
    this.totalRequests = 0;
    this.successfulRequests = 0;
    this.failedRequests = 0;
    this.totalTokens = 0;
    this.totalPromptTokens = 0;
    this.totalCompletionTokens = 0;
    this.totalLatencyMs = 0;
    this.requestsByModel = {};
    this.requestsByEndpoint = {};
    this.consecutiveErrors = 0;
    this.lastErrors = [];
  }
}
