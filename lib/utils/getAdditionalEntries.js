const querystring = require('querystring');

/**
 * @typedef {Object} AdditionalEntries
 * @property {import('./injectRefreshEntry').WebpackEntry} prependEntries
 * @property {import('./injectRefreshEntry').WebpackEntry} overlayEntries
 */

/**
 * Creates an object that contains two entry arrays: the prependEntries and overlayEntries
 * @param {Object} optionsContainer This is the container for the options to this function
 * @param {import('../types').NormalizedPluginOptions} optionsContainer.options Configuration options for this plugin.
 * @param {import('webpack').Compiler["options"]["devServer"]} [optionsContainer.devServer] The webpack devServer config
 * @returns {AdditionalEntries} An object that contains the Webpack entries for prepending and the overlay feature
 */
function getAdditionalEntries({ devServer, options }) {
  /** @type {Record<string, *>} */
  let resourceQuery = {};

  if (devServer) {
    const { sockHost, sockPath, sockPort, port, host, https, http2 } = devServer;

    (sockHost || host) && (resourceQuery.sockHost = sockHost ? sockHost : host);
    sockPath && (resourceQuery.sockPath = sockPath);
    (sockPort || port) && (resourceQuery.sockPort = sockPort ? sockPort : port);
    resourceQuery.sockProtocol = https || http2 ? 'https' : 'http';
  }

  if (options.overlay) {
    options.overlay.sockHost && (resourceQuery.sockHost = options.overlay.sockHost);
    options.overlay.sockPath && (resourceQuery.sockPath = options.overlay.sockPath);
    options.overlay.sockPort && (resourceQuery.sockPort = options.overlay.sockPort);
    options.overlay.sockProtocol && (resourceQuery.sockProtocol = options.overlay.sockProtocol);
  }

  // We don't need to URI encode the resourceQuery as it will be parsed by Webpack
  const queryString = querystring.stringify(resourceQuery, undefined, undefined, {
    /**
     * @param {string} string
     * @returns {string}
     */
    encodeURIComponent(string) {
      return string;
    },
  });

  const prependEntries = [
    // React-refresh runtime
    require.resolve('../../client/ReactRefreshEntry'),
  ];

  const overlayEntries = [
    // Legacy WDS SockJS integration
    options.overlay &&
      options.overlay.useLegacyWDSSockets &&
      require.resolve('../../client/LegacyWDSSocketEntry'),
    // Error overlay runtime
    options.overlay &&
      options.overlay.entry &&
      `${options.overlay.entry}${queryString ? `?${queryString}` : ''}`,
  ].filter(Boolean);

  return { prependEntries, overlayEntries };
}

module.exports = getAdditionalEntries;
