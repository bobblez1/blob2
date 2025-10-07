# AI Rules for Blob Multiplayer Telegram Game

This document outlines the core technologies used in this application and provides clear guidelines for using specific libraries and tools.

## Tech Stack

*   **React**: The primary JavaScript library for building the user interface.
*   **TypeScript**: Used for type safety and improved code maintainability across the entire codebase.
*   **Vite**: The build tool and development server, providing a fast development experience.
*   **Tailwind CSS**: A utility-first CSS framework used for all styling, ensuring a consistent and responsive design.
*   **React Context API**: Utilized for global state management, specifically for game-related data and settings, via `GameContext`.
*   **Lucide React**: A library providing a collection of beautiful and customizable SVG icons for the application.
*   **Shadcn/ui**: A collection of reusable components built with Radix UI and Tailwind CSS, available for building consistent UI elements.
*   **Supabase**: Integrated for potential future backend services, authentication, and database interactions.
*   **Web Audio API & Haptic Feedback**: Custom utilities are provided for sound effects and device vibrations to enhance the user experience.
*   **Local Storage**: The `useLocalStorage` hook is implemented for client-side data persistence.

## Library Usage Rules

To maintain consistency and efficiency, please adhere to the following guidelines when developing:

*   **Styling**: Always use **Tailwind CSS** for all styling. Avoid writing custom CSS or using other styling libraries.
*   **UI Components**: Prioritize using **shadcn/ui** components for common UI elements (e.g., buttons, cards, modals). If a specific component is not available or requires significant customization, create a new, small component using Tailwind CSS.
*   **Icons**: Use **lucide-react** for all icons.
*   **State Management**:
    *   For local component state, use React's `useState` hook.
    *   For global game-related state, leverage the existing `GameContext` (React Context API).
    *   For persistent client-side data, use the `useLocalStorage` hook.
*   **Routing**: For any new routing requirements, **React Router** should be used. The current screen management in `App.tsx` uses `useState`, but for more complex navigation, React Router is the preferred solution.
*   **Backend/Authentication/Database**: **Supabase** (`@supabase/supabase-js`) is the designated library for all backend, authentication, and database interactions.
*   **Audio & Haptics**: Use the utility functions provided in `src/utils/gameUtils.ts` (e.g., `playSound`, `vibrate`) for all sound effects and haptic feedback.
*   **Game Logic & AI**: Implement game-specific logic and bot AI using the custom utilities found in `src/utils/gameUtils.ts` and `src/utils/botAI.ts`.