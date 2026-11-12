/* Turns "icon-1home.png" into the full path of a picture in public/assets.
   import.meta.env.BASE_URL is "/Starry-Budget/" (set in vite.config.ts). */
export function asset(fileName: string): string {
  return `${import.meta.env.BASE_URL}assets/${fileName}`;
}
