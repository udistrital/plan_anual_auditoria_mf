/**
 * Mapping of user roles to sender roles for notifications.
 * 
 * Keys are the system roles, and values are the corresponding sender roles.
 * 
 * Example:
 * `rolRemitentePorRol["AUDITOR_EXPERTO"]` returns `"Auditor (a)"`
 */
export const rolRemitentePorRol: {
    [rol: string]: string;
} = {
    ADMIN_SISIFO: "Administrador (a)",
    JEFE_CONTROL_INTERNO: "Jefe OCI",
    SECRETARIO_AUDITORIA: "Secretario (a) de Auditoría",
    AUDITOR_EXPERTO: "Auditor (a)",
};

export default rolRemitentePorRol;
