import Ajv from 'ajv';
import type { DebateConfig } from '../types/debate';
import debateSchema from '../schemas/debate_config.schema.json';

const ajv = new Ajv();
const validate = ajv.compile(debateSchema);

export function validateDebateConfig(config: unknown): config is DebateConfig {
  const isValid = validate(config);
  if (!isValid) {
    console.error('Config validation errors:', validate.errors);
    return false;
  }
  return true;
}

export function getValidationErrors(): string[] {
  if (!validate.errors) return [];
  return validate.errors.map(error => 
    `${error.instancePath} ${error.message}`
  );
}