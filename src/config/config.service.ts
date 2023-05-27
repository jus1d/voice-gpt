import { IConfigService } from './config.interface';
import signale from 'signale';
import config from 'config';

export class ConfigService implements IConfigService {
    get(key: string): string {
        if (!config.has(key)) {
            throw new Error(`No '${key}' value in config file provided`);
        } else {
            return config.get(key);
        }
    }
}