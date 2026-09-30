import { mergeConfig } from 'vitest/config';
// Copy this evidence folder to frontend/.verificacion/aunor-auditoria-general
// before running: dependencies and aliases belong to the frontend workspace.
import base from '../../vitest.config.mts';
export default mergeConfig(base, {test:{include:['.verificacion/aunor-auditoria-general/*.test.tsx'],maxWorkers:1}});
