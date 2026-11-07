// The build bundles these files into the script as text.
declare module "*.css" {
  const text: string;
  export default text;
}
declare module "*.html" {
  const text: string;
  export default text;
}
