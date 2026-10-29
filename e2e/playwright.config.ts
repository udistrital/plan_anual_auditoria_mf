import { defineConfig } from '@playwright/test';
import { BASE_URL, proyectosPorRol } from './core/config';
import type { MetadatosE2E } from './core/global-setup';

/**
 * Roles de plan_anual_auditoria_mf con usuario de prueba (RolService / environment.ROL):
 * auditor → AUDITOR, jefe-dependencia → JEFE_DEPENDENCIA, auditor-experto → AUDITOR_EXPERTO,
 * jefe-oci → JEFE_CONTROL_INTERNO, secretario → SECRETARIO_AUDITOR, admin → ADMIN_SISIFO.
 */
const ROLES = ['auditor', 'jefe-dependencia', 'auditor-experto', 'jefe-oci', 'secretario', 'admin'];

const metadatos: MetadatosE2E = {
  roles: ROLES,
  // El core-mf deja la sesión completa cuando guarda el token, el menú y la persona.
  clavesSesion: ['id_token', 'menu', 'persona_id'],
};

export default defineConfig({
  testDir: './tests',
  globalSetup: require.resolve('./core/global-setup'),
  metadata: metadatos,
  fullyParallel: false, // comparten backend y datos del ambiente de pruebas
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 20_000 },
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: BASE_URL,
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // E2E_VIDEO=on graba cada escenario (ensayos de la demo). El login no aparece: corre en un proceso aparte.
    video: process.env['E2E_VIDEO'] === 'on' ? 'on' : 'off',
    navigationTimeout: 90_000,
    // Ninguna acción (clic, fill) espera más de 60 s: sin esto, un control que nunca se habilita cuelga
    // el escenario hasta su timeout total (20 min en los @escritura).
    actionTimeout: 60_000,
  },
  projects: proyectosPorRol(ROLES),
});
