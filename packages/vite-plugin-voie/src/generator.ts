import path from 'path';
import dirTree from 'directory-tree';
import { Options } from './options';
import { resolve } from './resolver';
import { stringifyRoutes } from './routes';
import { generateRoutes } from './buildRoutes'
import { normalizePath } from './utils'
import globToRegExp from 'glob-to-regexp';

import Debug from 'debug'


const debug = Debug('vite-plugin-voie:gen')

/**
 * Generates a string containing code that exports
 * a `routes` array that is compatible with Vue Router.
 */
export async function generateRoutesCode(options: Options) {
  const { root, pagesDir, exclude, extensions, extendRoute } = options;
  const dir = normalizePath(path.join(root, pagesDir));

  const extensionsRE = new RegExp(`\\.(${extensions.join('|')}|vue)$`)
  const excludeRE = globToRegExp(`${dir}/${exclude[0]}`, { extended: true });

  // Generate dir tree
  const dirTrees = dirTree(dir, {
    extensions: extensionsRE,
    exclude: excludeRE
  })

  const routes = generateRoutes(dirTrees, options)

  debug('routes: %O', routes);

  // const normalizedRoot = normalizePath(root);
  // const routes = buildRoutes({
  //   files,
  //   dir,
  //   extensions,
  //   root: normalizedRoot,
  //   extendRoute,
  // });

  return stringifyRoutes(routes, options);
}
