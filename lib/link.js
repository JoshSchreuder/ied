'use strict'

var fs = require('fs')
var path = require('path')
var async = require('async')
var config = require('./config')
var forceSymlink = require('force-symlink')

// Generates the symlinks to be created in order to link to passed in package.
exports.getSymlinks = getSymlinks
function getSymlinks (cwd, pkg) {
  var libSymlink = [cwd, path.join(config.globalNodeModules, pkg.name)]
  var bin = pkg.bin
  if (typeof bin === 'string') {
    bin = {}
    bin[pkg.name] = pkg.bin
  }
  bin = bin || {}
  var binSymlinks = Object.keys(bin).map(function (name) {
    return [
      path.join(config.globalNodeModules, pkg.name, bin[name]),
      path.join(config.globalBin, name)
    ]
  })
  return binSymlinks.concat([ libSymlink ])
}

// Used for `ied link`.
// Should globally expose the package we're currently in.
exports.linkToGlobal = linkToGlobal
function linkToGlobal (cwd, cb) {
  var pkg = require(path.join(cwd, 'package.json'))
  var symlinks = getSymlinks(cwd, pkg)
  async.each(symlinks, function (symlink, cb) {
    var srcPath = symlink[0]
    var dstPath = symlink[1]
    console.log(dstPath, '->', srcPath)
    forceSymlink(srcPath, dstPath, cb)
  }, cb)
}

// Used for `ied link some-package`.
// Allows you to `require` `some-package` in the current repo afterwards.
// This won't change your project's node_modules/.bin directory.
exports.linkFromGlobal = linkFromGlobal
function linkFromGlobal (cwd, name, cb) {
  var dstPath = path.join(cwd, 'node_modules', name)
  var srcPath = path.join(config.globalNodeModules, name)
  console.log(dstPath, '->', srcPath)
  forceSymlink(srcPath, dstPath, cb)
}

// Used for `ied unlink`.
// Reverts `ied link` by removing the previously created symlinks.
exports.unlinkToGlobal = unlinkToGlobal
function unlinkToGlobal (cwd, name, cb) {
  var pkg = require(path.join(cwd, 'package.json'))
  var symlinks = getSymlinks(cwd, pkg)
  async.each(symlinks, function (symlink, cb) {
    var dstPath = symlink[1]
    console.log('rm', dstPath)
    fs.unlink(dstPath, cb)
  }, cb)
}

// Used for `ied unlink some-package`.
// Reverts `ied unlink some-package` by removing the previously created
// symlinks from the project's node_modules directory.
exports.unlinkFromGlobal = unlinkFromGlobal
function unlinkFromGlobal (cwd, name, cb) {
  var dstPath = path.join(cwd, 'node_modules', name)
  console.log('rm', dstPath)
  fs.unlink(dstPath, cb)
}
