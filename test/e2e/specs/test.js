// For authoring Nightwatch tests, see
// http://nightwatchjs.org/guide#usage

module.exports = {
  'default page': function (browser) {
    // automatically uses dev Server port from /config.index.js
    // default: http://localhost:8080
    // see nightwatch.conf.js
    const devServer = browser.globals.devServerURL

    browser
      .url(devServer)
      .waitForElementVisible('#app', 5000)      
      .assert.elementPresent('.contents')
      .assert.containsText('.contents', 'Basic')
      .assert.elementPresent('.obg-footer')
      .assert.elementPresent('.obg-button .obg-icon-back')
      .assert.elementPresent('.obg-button .obg-icon-more')
      .end()
  },

}
