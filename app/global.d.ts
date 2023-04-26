declare module "*.jpg";
declare module "*.png";
declare module "*.woff2";
declare module "*.woff";
declare module "*.ttf";
declare module "*.scss" {
  const content: Record<string, string>;
  export default content;
}
declare module 'highlight.js' {
  export function highlightAll(): void;
}
declare module "*.svg";
