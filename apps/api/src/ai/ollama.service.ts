import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);
  private readonly baseUrl: string;
  private readonly modelName: string;

  constructor(
    private configService: ConfigService,
    private audit: AuditService,
  ) {
    this.baseUrl = (this.configService.get('OLLAMA_HOST') as string) || process.env.OLLAMA_HOST || 'http://localhost:11434';
    this.modelName = (this.configService.get('OLLAMA_MODEL') as string) || process.env.OLLAMA_MODEL || 'qwen2.5-coder:1.5b';
  }

  /**
   * Generates completion from local Ollama model with strict timeout, single retry, and audit logging.
   */
  async generateCompletion(
    featureName: string,
    prompt: string,
    systemPrompt?: string,
    actorId?: string,
    actorName?: string,
    actorRole?: string,
  ): Promise<{ success: boolean; data?: string; json?: any; error?: string; latencyMs?: number }> {
    const startTime = Date.now();
    const endpoint = `${this.baseUrl}/api/generate`;

    const payload = {
      model: this.modelName,
      prompt: prompt,
      system: systemPrompt || 'You are an AI assistant for Campus Connect academic management. Respond accurately and concisely.',
      stream: false,
    };

    let attempt = 0;
    const maxAttempts = 2;

    while (attempt < maxAttempts) {
      attempt++;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Ollama HTTP Error ${response.status}: ${response.statusText}`);
        }

        const resData = await response.json();
        const latencyMs = Date.now() - startTime;
        const responseText = resData.response || '';

        // Attempt JSON parsing if JSON expected
        let parsedJson: any = null;
        try {
          const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || responseText.match(/```\s*([\s\S]*?)\s*```/);
          const rawJson = jsonMatch ? jsonMatch[1] : responseText;
          parsedJson = JSON.parse(rawJson.trim());
        } catch (e) {
          // Not valid JSON or text response
        }

        if (actorId && actorName && actorRole) {
          await this.audit.log(
            actorId,
            actorName,
            actorRole,
            `AI Request: ${featureName}`,
            `Ollama execution successful (${latencyMs}ms, model: ${this.modelName})`,
            'ai',
            'OllamaInference',
            featureName,
          );
        }

        return {
          success: true,
          data: responseText,
          json: parsedJson,
          latencyMs,
        };
      } catch (err: any) {
        this.logger.warn(`Ollama attempt ${attempt} failed for feature '${featureName}': ${err.message}`);
        if (attempt >= maxAttempts) {
          const latencyMs = Date.now() - startTime;
          if (actorId && actorName && actorRole) {
            await this.audit.log(
              actorId,
              actorName,
              actorRole,
              `AI Request Failed: ${featureName}`,
              `Ollama execution failed after ${attempt} attempts (${latencyMs}ms): ${err.message}`,
              'ai',
              'OllamaInference',
              featureName,
            );
          }
          return {
            success: false,
            error: err.name === 'AbortError' ? 'Ollama request timed out (20s)' : err.message,
            latencyMs,
          };
        }
      }
    }

    return { success: false, error: 'Ollama call failed after retries' };
  }
}
