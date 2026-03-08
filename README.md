# Vape Quit Assistant

Una aplicación completa para ayudarte a dejar de vapear con planes personalizados generados por IA.

## Requisitos

- Node.js 18 o superior
- Una clave de API de Gemini (consíguela en [Google AI Studio](https://aistudio.google.com/app/apikey))

## Instalación

1. Instala las dependencias:
   ```bash
   npm install
   ```

2. Configura las variables de entorno:
   - Copia `.env.example` a `.env`
   - Añade tu `GEMINI_API_KEY` en el archivo `.env`

## Desarrollo

Para ejecutar la aplicación en modo desarrollo:
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:3000`.

## Producción

Para compilar y ejecutar en modo producción:
```bash
npm run build
npm start
```

## Características

- Generación de planes personalizados con IA (Gemini).
- Seguimiento de progreso y puntos.
- Chat de apoyo en tiempo real.
- Base de datos local (SQLite).
