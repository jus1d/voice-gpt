import config from 'config';
import { IConfigService } from './config.interface';

export class ConfigService implements IConfigService {
    get(key: string): string {
        if (!config.has(key)) {
            throw new Error('No token provided');
        } else {
            return config.get(key);
        }
    }
}