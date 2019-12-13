/**
 * Created by krinmayu on 2017-04-19.
 */

var nodeGit = require('nodegit');
var repository = nodeGit.Repository;
var simpleGit = require('simple-git');
var inquirer = require('inquirer');
var fs = require('fs-extra');
var glob = require('glob');
var npm = require('npm-bundle');
var path = require('path');
var fileName = 'package.json';
var url = 'git@github.com:OBIGOGIT/obigo-sdk-ojsf-starter-kit.git';
var promise = require('promise');
var pread = promise.denodeify(fs.readFile);
var pwrite = promise.denodeify(fs.writeFile);

function createRelease() {
  repository.init('./release', 0).then(function () {
    console.log('Release init');
    process.chdir('./release');
    simpleGit().addRemote('origin', url, function () {
      console.log('Release remote complete')
      simpleGit().pull('origin', 'release/publish', createMaster)
    })
  })
}
function createMaster() {
  process.chdir('..');
  nodeGit.Repository.init('./master', 0).then(function () {
    console.log('Master init');
    process.chdir('./master');
    simpleGit().addRemote('origin', url, function () {
      console.log('Master remote complete');
      simpleGit().pull('origin', 'master', overwrite)
    })
  })
}
function overwrite() {
  process.chdir('..');
  fs.readdir('release', function modifyrRelese(err, list) {
    var i;
    var length = list.length;
    for (i = 0; i < length; i++) {
      if (list[i] === '.git') {
        continue
      }
      else {
        fs.remove('./release/' + list[i])
      }
    }
    modifyMaster();
  })
}
function modifyMaster() {
  fs.remove('./master/.git', function () {
    fs.copy('master', 'release', function () {
      fs.remove('master', function () {
        console.log('modify complete');
        searchKey();
      })
    })
  })
}
function searchKey() {
  process.chdir('release');
  fs.readFile(fileName, 'utf8', function (err, data) {
    if (process.argv[3] === undefined) {
      createCore();
    }
    else {
      var regex = '(' + 'version' + ')(\\W+)(\\S+)(")',
        reg = new RegExp(regex, 'gi');
      var result = data.replace(reg, function (match, p1, p2, p3, p4) {
        p3 = process.argv[3];
        var file = p1.concat(p2, p3, p4);
        return file;
      })
      fs.writeFile(fileName, result, createCore)
    }
  })
}
function createCore() {
  var name = 'js_core';
  var root = './obigo_update/js_core';
  var url = 'git@github.com:OBIGOGIT/obigo-sdk-ojsf-vue.git';
  var data = 'dist\nsrc\ntypes\npackage.json';
  init(root, url, data, name);
}
function createUi() {
  var name = 'js_ui';
  var root = './obigo_update/js_ui';
  var url = 'git@github.com:OBIGOGIT/obigo-sdk-ojsf-obigo-ui.git';
  var data = 'dist\nsrc\npackage.json';
  init(root, url, data, name);
}
function createWebapi() {
  var name = 'js_webapi';
  var root = './obigo_update/js_webapi';
  var url = 'git@github.com:OBIGOGIT/obigo-sdk-ojsf-webapi.git';
  var data = '*';
  init(root, url, data, name);
}
function init(root, url, data, name) {
  repository.init(root, 0).then(function () {
    process.chdir(root);
    fs.writeFile('.git/info/sparse-checkout', data, function () {
      simpleGit().addConfig('core.sparseCheckout', 'true', function () {
        simpleGit().addRemote('origin', url, function (err) {
          if (err) {
            remove(name)
          }
          else {
            build(name);
          }
        })
      })
    })
  })
}
function build() {
  simpleGit().fetch('[--tags]', function () {
    simpleGit().tags(function (err, tags) {
      simpleGit().checkoutBranch('test', tags.latest, pack)
    })
  })
}
function pack() {
  var args = [];
  var options = {
    verbose: true
  }
  npm(args, options, makeObigolib)
}
function makeObigolib(err, outfile) {
  process.chdir('../..');
  glob('obigo_update/**/*.tgz', '', function (err, files) {
    fs.move(files[0], './obigo_lib/' + path.basename(files[0]), function () {
      glob('obigo_lib/**/*.tgz', '', function (err, results) {
        if (results.length === 1)
          createUi();
        else if (results.length === 2)
          createWebapi();
        else
          changePackage();
      })
    })
  })
}
function changePackage() {
  glob('obigo_lib/**/*.tgz', '', function (err, files) {
    pread(fileName, 'utf8').then(function (data) {
      files.forEach(function (v, i) {
        var strArray = v.split('/');
        var category = strArray[1].split('-', 3)
        var regex = '(' + category[0] + '-' + category[1] + '-' + category[2] + ')(\\W+)(\\S+)(\\")';
        var reg = new RegExp(regex, 'gi');
        var file = data.replace(reg, function (match, p1, p2, p3, p4) {
          p3 = 'file:' + v;
          var result = p1.concat(p2, p3, p4);
          return result;
        });
        data = file;
      }); //files.forEach end
      fs.writeFile(fileName, data, optionCheck)
    })
  })
}
function optionCheck () {
  var isExist = process.argv.indexOf('-t')
  if (isExist !== -1) {
    return 0
  }
  else {
    inputCommitmessage()
  }
}
function inputCommitmessage() {
  simpleGit().add('./*', function () {
    simpleGit().commit('build Test', function () {
      simpleGit().push(['-v', 'origin', 'master:release/publish'], getVersion)
    })
  })
}
function getVersion() {
  fs.readFile(fileName, 'utf8', function (err, data) {
    if (err) throw err;
    var re = /version(?:\D*)(\d+\D\d+\D\d+)/i;
    var result = data.match(re);
    addTag(result);
  })
}
function addTag(result) {
  simpleGit().addTag('ide-v' + result[1], function (err) {
    if (err) {
      simpleGit().addTag('ide-v' + result[1] + '3', function (err) {
        console.log(err)
      })
    }
    simpleGit().push('origin', 'ide-v' + result[1], function () {
      console.log('push tags')
    })
  })
}
createRelease();
