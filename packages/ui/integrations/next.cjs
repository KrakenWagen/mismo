// What a Next.js app needs in its config. Next.js only turns on Babel and PostCSS when it finds their
// config files, so those stay: see this package's README.
function withUI(config = {}) {
  return {
    ...config,
    transpilePackages: [...(config.transpilePackages ?? []), "@mismo/ui", "react-strict-dom"],
  };
}

module.exports = { withUI };
