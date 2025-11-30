const { overrideDevServer } = require('customize-cra');

const devServerConfig = config => {
  return {
    ...config,
  };
};

module.exports = overrideDevServer(devServerConfig);
