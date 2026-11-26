/**
 * Node has no idea what a `.css` import means. The studio (like every other
 * page in the repo) imports stylesheets for their side effects, so the test
 * runner resolves them to an empty module.
 */
export async function resolve(specifier, context, next) {
  if (specifier.endsWith('.css')) {
    return { url: 'data:text/javascript,export default {};', shortCircuit: true };
  }
  return next(specifier, context);
}

export async function load(url, context, next) {
  if (url.startsWith('data:text/javascript')) {
    return { format: 'module', source: 'export default {};', shortCircuit: true };
  }
  return next(url, context);
}
