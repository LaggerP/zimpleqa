# Test: Validación de formulario de contacto

## Descripción
Verifica que los campos requeridos del formulario de contacto son validados correctamente.

## URL de prueba
${BASE_URL}/contacto

## Pasos de prueba

1. Navegar a la página de contacto
2. Dejar el campo "Nombre" vacío
3. Llenar el campo "Email" con test@example.com
4. Llenar el campo "Mensaje" con "Este es un mensaje de prueba"
5. Hacer clic en el botón de enviar formulario
6. Verificar que aparece un mensaje de error indicando que el campo Nombre es requerido
7. Verificar que el formulario no se envía (la URL no cambia)

## Resultados esperados
- Se muestra un mensaje de error visible: "Nombre es requerido"
- El formulario permanece en la misma página
- No hay redirección

## Variables
BASE_URL=https://example.com
