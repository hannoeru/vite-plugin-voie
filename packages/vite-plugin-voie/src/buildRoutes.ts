
import path from 'path'
import dirTree from 'directory-tree';
import globToRegExp from 'glob-to-regexp';
import { Options } from './options';
import { normalizePath } from './utils';

export function generateRoutes(pageTrees: dirTree.DirectoryTree, options: Options, routePath?: string) {
  const { root, pagesDir, exclude, extensions, extendRoute } = options;
  let routes = []
  let dirList: dirTree.DirectoryTree = []
  let fileList: dirTree.DirectoryTree = []

  const treeNodes = pageTrees.children

  const dir = normalizePath(path.join(root, pagesDir));

  const extensionsRE = new RegExp(`\\.(${extensions.join('|')}|vue)$`)
  const excludeRE = globToRegExp(`${dir}/${exclude[0]}`, { extended: true });

  const wildcardRE = new RegExp(/\[.{3}all\]/)

  function resolveComponentPath(path) {
    return normalizePath(path.replace(root, ''))
  }

  function resolveRoutePath(path) {
    return normalizePath(path).replace(dir, '').toLowerCase().replace(extensionsRE, '').replace(wildcardRE, '*').replace('[', ':').replace(']', '')
  }

  function normalizeName(path) {
    return resolveRoutePath(normalizePath(path)).toLowerCase().replace(/^\//, '').replace(/(\/:|\/)/, '-').replace('-index', '')
  }

  treeNodes.forEach((tree: dirTree.DirectoryTree) => {
    const isDir = tree.type === 'directory'
    if (isDir) {
      dirList.push(tree)
    } else {
      fileList.push(tree)
    }
  })

  for (let i = 0; i < dirList.length; i++) {
    const dirNode = dirList[i];
    
    const resultIndex = fileList.findIndex((file) => {
      return normalizeName(dirNode.name) === normalizeName(file.name)
    })

    const result = fileList[resultIndex]
    
    if (resultIndex !== -1) {
      fileList = fileList.filter((item, index)=>{
        return index !== resultIndex
      })
      dirList[i] = Object.assign({}, dirNode, result)
      dirList[i].type = 'nested'
    }
  }

  const mergeList: dirTree.DirectoryTree = [...dirList, ...fileList]

  for (let i = 0; i < mergeList.length; i++) {
    const node = mergeList[i];
    const path = node.path
    delete node.size
    if (node.extension) {
      node.component = resolveComponentPath(path)
    }
    node.name = normalizeName(path)
    if (node.name === 'index') {
      node.path = '/'
    } else {
      node.path = resolveRoutePath(path)
      if (node.path.endsWith('/index')) {
        node.path = node.path.replace('/index', '')
      }
      if (pageTrees.type === 'nested') {
        node.path = node.path.replace(pageTrees.path, '') || '/'
      }
    }
    node.props = true
    if (node?.children?.length >= 1) {
      node.children = generateRoutes(node, options)
    } else if (node?.children?.length === 1 && node.name === 'index') {
      node.component = resolveComponentPath(node?.children[0].path)
      delete node.children
    }
    if (node.type === 'nested') {
      delete node.name
    }
    if (node.type === 'directory') {
      routes.push(...node.children)
    } else {
      delete node.extension
      delete node.type
      routes.push(node)
    }
  }

  return routes
}