# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Empaquetado con Electron

El proyecto incluye una configuración mínima de Electron para generar paquetes de escritorio en Windows.

1. Duplica los archivos `.env.local.example` y `.env.production.example` según la variante que necesites (`.env.local`, `.env.production`) y ajusta `VITE_API_BASE_URL`.
2. Ejecuta `npm run electron:build -- --variant prod` para empaquetar contra el backend de producción (por defecto).
3. Ejecuta `npm run electron:build -- --variant local` para empaquetar utilizando las variables definidas en `.env.local`.
4. Cada build genera un número incremental y coloca todos los artefactos dentro de `release/<variant>-<version>.<build>` (por ejemplo, `release/prod-0.0.1.42/`). El contador compartido del workspace se conserva en la raíz del repo (`../../release/build-number.json`), inicia en 1 y lo podés reiniciar o alinear con CI ajustando `BUILD_NUMBER_SEED` o fijando `BUILD_NUMBER` antes de ejecutar el script.
5. Puedes reemplazar `assets/images/logo.png` y `assets/images/logo.ico` para ajustar el icono de la ventana y del instalador.

Los comandos `electron:build:*` registran en consola todas las variables `VITE_*` activas antes de iniciar el proceso, para que puedas confirmar qué backend se usará en cada variante. Internamente se usa un modo de Vite propio para cada variante, por lo que no es necesario crear archivos `.env.electron-*`; basta con mantener `.env.local` y `.env.production`.

El proceso de escritorio expone en `window.cygnusDesktop` la configuración utilizada (`config.apiBaseUrl` y `variant`), lo que permite a la aplicación web resolver el backend activo y persistir la sesión.

## Versionado automático

- Los commits (salvo los que comiencen con `wip:` o merges) activan un hook que ejecuta `npm run format`, `npm run lint`, `npm run typecheck` y `npm run build:app`. Si alguno falla, el commit se cancela.
- El hook interpreta el prefijo del commit (Conv. Commits): `feat` incrementa el minor, `fix` y el resto el patch, y `!`/`BREAKING CHANGE` elevan el major. El versionado se aplica directamente en `package.json`/`package-lock.json`.
- Luego de crear el commit, un hook `post-commit` vuelve a ejecutar `npm run build` (para generar artefactos y `buildNumber`) y hace `git commit --amend` para dejar registrado `major.minor.patch.buildNumber` en el historial sin cambiar el mensaje original.
- Cada build actualiza el campo `buildNumber` en `package.json` usando `build-number-generator`, por lo que la versión efectiva queda como `major.minor.patch.buildNumber`.
- Ejecutá `npm install` para que Husky instale los hooks vía `npm run prepare`. Si necesitás saltarte las validaciones usá `wip:` como prefijo del commit.
