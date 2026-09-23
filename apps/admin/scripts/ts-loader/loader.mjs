// Retries relative specifiers with a .ts suffix (Next-style extensionless imports)
// so payload.config.ts + its TS graph loads under native Node type stripping.
export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context)
  } catch (err) {
    if (err?.code === 'ERR_MODULE_NOT_FOUND' && typeof specifier === 'string' && specifier.startsWith('.') && !specifier.endsWith('.ts')) {
      try {
        return await next(`${specifier}.ts`, context)
      } catch {
        return next(`${specifier}/index.ts`, context)
      }
    }
    throw err
  }
}
