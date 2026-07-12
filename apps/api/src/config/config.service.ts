import { Injectable } from '@nestjs/common';
import { EnvConfig, validateEnv } from './env.validation';

@Injectable()
export class ConfigService {
  private readonly envConfig: EnvConfig;

  constructor() {
    this.envConfig = validateEnv();
  }

  get<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
    return this.envConfig[key];
  }
}
