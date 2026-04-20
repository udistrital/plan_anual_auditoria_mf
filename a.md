Este pull request mejora el manejo de los auditores disponibles en el `ModalAgregarAuditorComponent`, asegurando que cada desplegable muestre únicamente los auditores que no hayan sido seleccionados en otras filas. Los cambios principales introducen un mecanismo de caché por fila para los auditores disponibles, actualizaciones automáticas cuando cambian las selecciones y la limpieza adecuada de las suscripciones.

Relacionado:

- udistrital/sisifo_documentacion#714

**Mejoras en la lógica de selección de auditores:**

- Se reemplazó la lista estática `auditores` por el método dinámico `auditoresDisponibles(i)` en la plantilla, de modo que cada desplegable muestre solo auditores no seleccionados en otras filas.
- Se añadió una caché por fila (`auditoresDisponiblesCache`) y el método `recomputeAuditoresDisponibles()` para recalcular de forma eficiente los auditores disponibles cada vez que cambian las selecciones o se añaden/eliminan auditores. [[1]](diffhunk://#diff-2a434af164dfef363ba9c801f0c0c6749f49dbd34a5a6931a51623481d1097bcR26-R27) [[2]](diffhunk://#diff-2a434af164dfef363ba9c801f0c0c6749f49dbd34a5a6931a51623481d1097bcL175-R249)
- Se suscribió a los cambios de selección (`FormArray.valueChanges`) para actualizar automáticamente los auditores disponibles de cada desplegable cuando se modifica alguna selección, y se anuló la suscripción en `ngOnDestroy` para evitar fugas de memoria.
- Se actualizó la lógica para recalcular los auditores disponibles al agregar o eliminar auditores, garantizando que la interfaz refleje siempre el estado actual. [[1]](diffhunk://#diff-2a434af164dfef363ba9c801f0c0c6749f49dbd34a5a6931a51623481d1097bcR110) [[2]](diffhunk://#diff-2a434af164dfef363ba9c801f0c0c6749f49dbd34a5a6931a51623481d1097bcR138) [[3]](diffhunk://#diff-2a434af164dfef363ba9c801f0c0c6749f49dbd34a5a6931a51623481d1097bcR151) [[4]](diffhunk://#diff-2a434af164dfef363ba9c801f0c0c6749f49dbd34a5a6931a51623481d1097bcR98-R100)

**Mantenimiento de código:**

- Se implementó `OnDestroy` y se gestionó el ciclo de vida de las suscripciones para evitar fugas de memoria. [[1]](diffhunk://#diff-2a434af164dfef363ba9c801f0c0c6749f49dbd34a5a6931a51623481d1097bcL3-R4) [[2]](diffhunk://#diff-2a434af164dfef363ba9c801f0c0c6749f49dbd34a5a6931a51623481d1097bcL175-R249)
