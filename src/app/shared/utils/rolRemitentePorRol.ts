import { environment } from "src/environments/environment";

/**
 * Mapping of user roles to sender roles for notifications.
 *
 * Keys are the system roles, and values are the corresponding sender roles.
 *
 * Example:
 * `rolRemitentePorRol[environment.ROL.AUDITOR_EXPERTO]` returns `"Auditor (a)"`
 */
export const rolRemitentePorRol: {
    [rol: string]: string;
} = {
    [environment.ROL.ADMIN]: "Administrador (a)",
    [environment.ROL.JEFE]: "Jefe OCI",
    [environment.ROL.SECRETARIO]: "Secretario (a) de Auditoría",
    [environment.ROL.AUDITOR_EXPERTO]: "Auditor (a)",
    [environment.ROL.AUDITOR_ASISTENTE]: "Auditor (a) Asistente",
};

export default rolRemitentePorRol;
