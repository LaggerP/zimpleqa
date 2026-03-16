# Cómo usar zimpleQA desde cualquier carpeta

## 🚀 Opciones para usar zimpleQA fuera del repositorio

### Opción 1: Ejecutar directamente con Node (Más simple)

Desde cualquier carpeta, ejecuta:

```bash
node /ruta/a/zimpleqa/dist/cli/index.js <comando>
```

**En Windows:**
```bash
node F:/Codebase/AQUI/dist/cli/index.js init
node F:/Codebase/AQUI/dist/cli/index.js config
node F:/Codebase/AQUI/dist/cli/index.js run tests/
```

**En Linux/Mac:**
```bash
node /path/to/zimpleqa/dist/cli/index.js init
node /path/to/zimpleqa/dist/cli/index.js config
node /path/to/zimpleqa/dist/cli/index.js run tests/
```

### Opción 2: Crear un alias (Recomendado para uso diario)

#### En Windows (PowerShell):

1. Abre PowerShell
2. Ejecuta:
```powershell
function zqa {
    node F:/Codebase/AQUI/dist/cli/index.js $args
}
```

3. Para hacerlo permanente, agrégalo a tu perfil:
```powershell
notepad $PROFILE
```
Y agrega la función al final del archivo.

4. Recarga tu perfil:
```powershell
. $PROFILE
```

Ahora puedes usar:
```powershell
zqa init
zqa config set glm.apiKey tu-api-key
zqa run tests/
```

#### En Linux/Mac:

1. Edita tu archivo `~/.bashrc` o `~/.zshrc`:
```bash
nano ~/.bashrc
```

2. Agrega al final:
```bash
alias zqa='node /path/to/zimpleqa/dist/cli/index.js'
```

3. Recarga tu shell:
```bash
source ~/.bashrc
```

Ahora puedes usar:
```bash
zqa init
zqa config set glm.apiKey tu-api-key
zqa run tests/
```

### Opción 3: Crear un script wrapper (Permanente)

#### En Linux/Mac:

1. Crea el archivo `/usr/local/bin/zqa`:
```bash
sudo nano /usr/local/bin/zqa
```

2. Agrega este contenido:
```bash
#!/bin/bash
node /path/to/zimpleqa/dist/cli/index.js "$@"
```

3. Hazlo ejecutable:
```bash
sudo chmod +x /usr/local/bin/zqa
```

Ahora puedes usar `zqa` desde cualquier lugar.

#### En Windows:

1. Crea el archivo `C:\Windows\System32\zqa.bat`
2. Agrega este contenido:
```batch
@echo off
node F:\Codebase\AQUI\dist\cli\index.js %*
```

Ahora puedes usar `zqa` desde cualquier lugar.

## 📝 Ejemplo de uso en carpeta separada

### Paso 1: Navega a tu carpeta de trabajo

```bash
cd /path/to/your/project
# o en Windows
cd F:/path/to/your/project
```

### Paso 2: Inicializa zimpleQA

```bash
node F:/Codebase/AQUI/dist/cli/index.js init
```

Esto creará:
- `.zqa/` (configuración)
- `tests/` (tus tests)
- `tests/test-template.md` (template)

### Paso 3: Configura tu API key de GLM

```bash
node F:/Codebase/AQUI/dist/cli/index.js config set glm.apiKey tu-api-key
```

### Paso 4: Crea un test

Crea `tests/mi-test.md`:

```markdown
# Test: Mi primer test

## Descripción
Verificar que la página cargue correctamente

## URL
https://example.com

## Pasos
1. Navegar a https://example.com
2. Verificar título contiene "Example"

## Resultados esperados
- Página carga correctamente
- Título contiene "Example"
```

### Paso 5: Ejecuta el test

```bash
node F:/Codebase/AQUI/dist/cli/index.js run tests/mi-test.md
```

### Paso 6: Verifica configuración

```bash
node F:/Codebase/AQUI/dist/cli/index.js config
```

## 🎯 Comandos disponibles

```bash
# Inicializar proyecto
zqa init

# Ver configuración
zqa config

# Obtener valor específico
zqa config get glm.model

# Establecer valor
zqa config set glm.apiKey tu-key
zqa config set glm.model glm-5

# Ejecutar un test
zqa run tests/test.md

# Ejecutar todos los tests
zqa run tests/

# Con opciones
zqa run tests/ --model glm-5 --validate --verbose
```

## ✅ Verificación de funcionamiento

Para verificar que zimpleQA funciona desde cualquier carpeta:

```bash
cd /tmp  # o cualquier otra carpeta
node F:/Codebase/AQUI/dist/cli/index.js --version
node F:/Codebase/AQUI/dist/cli/index.js --help
```

## 🐛 Solución de problemas

### Error: "No such file or directory"
Asegúrate de usar la ruta correcta a `dist/cli/index.js`.

### Error: "Command not found: zqa"
Si creaste un alias, recarga tu shell:
```bash
source ~/.bashrc  # Linux/Mac
. $PROFILE  # PowerShell
```

### Error: "Cannot find module"
Asegúrate de que el proyecto está compilado:
```bash
cd F:/Codebase/AQUI
bun run build
```

## 📚 Documentación adicional

- [README.md](README.md) - Guía completa de uso
- [INSTALL.md](INSTALL.md) - Guía de instalación detallada
- [ARCHITECTURE.md](ARCHITECTURE.md) - Diseño del sistema
- [CONTRIBUTING.md](CONTRIBUTING.md) - Cómo contribuir
