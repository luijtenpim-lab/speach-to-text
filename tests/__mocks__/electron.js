const os = require('os')
const path = require('path')

module.exports = {
  app: {
    getPath: (name) => {
      if (name === 'userData') return path.join(os.tmpdir(), 'voiceflow-test')
      return os.tmpdir()
    }
  }
}
