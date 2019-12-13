var nodeGit = require('nodegit');
var repository = nodeGit.Repository;
var simpleGit = require('simple-git');
var inquirer = require('inquirer');
var fs = require('fs-extra');
var glob = require('glob');
var npm = require('npm-bundle');
var path = require('path');
var fileName = 'package.json';

var question = {
  type: 'rawlist',
  name: 'repo',
  message: 'what do you want?',
  choices: ['master', 'branch', 'tags']
}
function remove(name) {
  process.chdir('../..')
  console.log('이미존재합니다');
  inquirer.prompt({
    type: 'rawlist',
    name: 'select',
    message: 'do you want to delete?',
    choices: ['yes', 'no']
  }).then(function (answers) {
    if (answers.select === 'yes') {
      fs.remove('obigo_update/' + name, main)
    }
    else {
      main();
    }
  })
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
function main() {
  console.log('1st step')
  inquirer.prompt({
    type: 'rawlist',
    name: 'object',
    message: 'init object',
    choices: ['core', 'ui', 'api', 'next']
  }).then(function (anwsers) {
    if (anwsers.object === 'core') {
      createCore();
    }
    else if (anwsers.object === 'ui') {
      createUi();
    }
    else if (anwsers.object === 'api') {
      createWebapi();
    }
    else {
      changePackage();
    }
  })
}
function createCore() {
  var name = 'js_core';
  var root = './obigo_update/js_core';
  var url = 'https://github.com/OBIGOGIT/obigo-sdk-ojsf-vue.git';
  var data = 'dist\nsrc\ntypes\npackage.json';
  init(root, url, data, name);
}
function createUi() {
  var name = 'js_ui';
  var root = './obigo_update/js_ui';
  var url = 'https://github.com/OBIGOGIT/obigo-sdk-ojsf-obigo-ui.git';
  var data = 'dist\nsrc\npackage.json';
  init(root, url, data, name);
}
function createWebapi() {
  var name = 'js_webapi';
  var root = './obigo_update/js_webapi';
  var url = 'https://github.com/OBIGOGIT/obigo-sdk-ojsf-webapi.git';
  var data = '*';
  init(root, url, data, name);
}
function build() {
  inquirer.prompt(question).then(function (answers) {
    simpleGit().fetch('[--tags]', function () {
      if (answers.repo === 'master') {
        simpleGit().checkoutBranch('test', 'origin/master', pack)
      }
      else if (answers.repo === 'branch') {
        simpleGit().listRemote(['--heads'], function (err, branches) {
          console.log(branches)
          inquirer.prompt({
            type: 'input',
            name: 'branch',
            message: 'enter branch name'
          }).then(function (answers) {
            simpleGit().checkoutBranch('test', 'origin/' + answers.branch, pack)
          })
        })
      }
      else {
        simpleGit().tags(function (err, tags) {
          inquirer.prompt({
            type: 'rawlist',
            name: 'tag',
            message: 'select tag',
            choices: tags.all
          }).then(function (answers) {
            simpleGit().checkoutBranch('test', answers.tag, pack)
          })
        })
      }
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
function makeObigolib() {
  process.chdir('../..')
  glob('obigo_update/**/*.tgz', '', function (err, files) {
    fs.move(files[0], './obigo_lib/' + path.basename(files[0]), main)
  })
}
function changePackage() {
  inquirer.prompt({
    type: 'rawlist',
    name: 'category',
    message: 'select category',
    choices: ['obigo-js-core', 'obigo-js-ui', 'obigo-js-webapi', 'next']
  }).then(function (answers) {
    if (answers.category !== 'next') {
      glob('obigo_lib/' + answers.category + '*.tgz', '', function (err, files) {
        fs.readFile(fileName, 'utf8', function (err, data) {
          var regex = '(' + answers.category + ')(\\W+)(\\S+)(\\")';
          var reg = new RegExp(regex, 'gi');
          var file = data.replace(reg, function (match, p1, p2, p3, p4) {
            p3 = 'file:' + files[0];
            var result = p1.concat(p2, p3, p4);
            return result;
          })
          fs.writeFile(fileName, file, changePackage);
        })
      })
    }
    else {
      inputCommitmessage();
    }
  })
}
function inputCommitmessage() {
  inquirer.prompt({
    type: 'input',
    name: 'commit',
    message: 'Enter the commit message!'
  }).then(function (answers) {
    simpleGit().add('./*', function () {
      simpleGit().commit(answers.commit, function () {
        simpleGit().push(['-v', 'origin', 'master:final'], getVersion)
      })
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
  simpleGit().addTag('test_ide-v' + result[1], function (err) {
    if (err) {
      simpleGit().addTag('test_ide-v' + result[1] + '3', function (err) {
        console.log(err)
      })
    }
    simpleGit().pushTags('origin', function () {
      console.log('push tags')
    })
  })
}
module.exports = {
  main: main,
};
