/// <reference types="vite/client" />

// Declare CSS modules
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

// Declare regular CSS imports
declare module '*.css';
