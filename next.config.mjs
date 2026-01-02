let userConfig = undefined
try {
  userConfig = await import('./v0-user-next.config')
} catch (e) {
  // ignore error
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
  webpack: (config, { isServer, webpack }) => {
    // Exclude onnxruntime-node from all builds (serverless environments don't support native modules)
    config.externals = config.externals || []
    config.externals.push({
      'onnxruntime-node': 'commonjs onnxruntime-node',
    })
    
    // Ignore onnxruntime-node in webpack resolution
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'onnxruntime-node': false,
    }
    
    // Add alias to prevent bundling
    config.resolve.alias = {
      ...config.resolve.alias,
      'onnxruntime-node': false,
    }
    
    // Ignore onnxruntime-node during module resolution
    config.plugins = config.plugins || []
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^onnxruntime-node$/,
      })
    )
    
    return config
  },
}

mergeConfig(nextConfig, userConfig)

function mergeConfig(nextConfig, userConfig) {
  if (!userConfig) {
    return
  }

  for (const key in userConfig) {
    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key])
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...userConfig[key],
      }
    } else {
      nextConfig[key] = userConfig[key]
    }
  }
}

export default nextConfig
