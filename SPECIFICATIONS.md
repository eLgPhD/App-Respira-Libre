# Especificaciones del Proyecto: Remix: VapeOff

## 1. Descripción General
**Remix: VapeOff** es una aplicación inteligente diseñada para ayudar a jóvenes y adultos a dejar de vapear. La plataforma utiliza Inteligencia Artificial (Gemini API) para generar planes personalizados basados en el perfil del usuario, sus hábitos y motivaciones. Además, ofrece un sistema de gamificación para mantener el compromiso y apoyo psicológico mediante un chat interactivo.

## 2. Características Principales
- **Generación de Planes con IA**: Planes de 30 días personalizados con rutinas diarias, consejos de salud y estrategias de supervivencia.
- **Dashboard de Progreso**: Seguimiento en tiempo real de los días sin vapear, dinero ahorrado y hitos de salud alcanzados.
- **Gamificación**: Sistema de puntos y ligas (Bronce, Plata, Oro, Platino, Diamante) basado en el cumplimiento de tareas diarias.
- **Chat de Apoyo**: Un asistente virtual disponible 24/7 para brindar apoyo emocional y consejos prácticos.
- **Gestión de Recaídas**: Herramienta para analizar recaídas y ajustar el plan automáticamente.
- **Autenticación de Usuarios**: Registro e inicio de sesión para persistir el progreso en múltiples dispositivos.

## 3. Arquitectura Técnica
### Frontend
- **Framework**: React 19 con TypeScript.
- **Estilos**: Tailwind CSS 4.0.
- **Animaciones**: Motion (framer-motion).
- **Iconos**: Lucide React.
- **Renderizado de Markdown**: React Markdown para las respuestas de la IA.

### Backend
- **Servidor**: Express.js corriendo sobre Node.js.
- **Base de Datos**: SQLite (usando `better-sqlite3`) para almacenamiento local persistente.
- **Seguridad**: Hashing de contraseñas con `bcryptjs`.
- **Integración de IA**: SDK de `@google/genai` para interactuar con Gemini 3.1 Pro.

## 4. Estructura de Datos (Base de Datos)
### Tabla `users`
- `id`: Identificador único (Autoincremental).
- `username`: Nombre de usuario único.
- `password`: Contraseña hasheada.
- `userData`: Objeto JSON con datos físicos y hábitos del usuario.
- `planData`: Objeto JSON con el plan de 30 días generado por la IA.
- `quitDate`: Fecha de inicio del plan.
- `avatar`: Emoji o identificador del avatar del usuario.
- `points`: Puntos acumulados actualmente.
- `maxPoints`: Récord histórico de puntos (usado para las ligas).
- `completedTasks`: Lista JSON de IDs de tareas completadas.

## 5. Diseño y UX
- **Responsive Design**: Interfaz adaptativa para móviles, tablets y escritorio.
- **Estética "Glassmorphism"**: Uso de transparencias, desenfoques y gradientes para un look moderno y tecnológico.
- **Dark Mode**: Esquema de colores oscuro por defecto para reducir la fatiga visual.

## 6. Flujo del Usuario
1. El usuario completa un formulario inicial sobre sus hábitos de vapeo.
2. La IA genera un plan personalizado.
3. El usuario se registra para guardar su progreso.
4. Diariamente, el usuario marca tareas como completadas para ganar puntos.
5. Si el usuario siente ansiedad, puede hablar con el chat de apoyo.
6. En caso de recaída, el usuario puede reiniciar su contador y obtener un plan ajustado.
