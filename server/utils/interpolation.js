const interpolateVariables = (command, variables) => {
  let result = command

  Object.entries(variables).forEach(([key, value]) => {
    const pattern = new RegExp(`\\$${key}\\$`, 'g')
    result = result.replace(pattern, value || '')
  })

  return result
}

const getDeploymentVariables = (repoConfig, branch, branchConfig, paths) => {
  const branchType = branchConfig.type || 'dev'
  const codeFolder = require('path').join(paths.home, 'code', repoConfig.name)
  const releaseFolder = require('path').join(paths.home, 'release', repoConfig.name, branchType)

  return {
    cf: codeFolder,
    rf: releaseFolder,
    branch: branch,
    type: branchType,
    pm2Name: branchConfig.pm2Name,
    port: repoConfig.port,
    name: repoConfig.name,
    domain: repoConfig.domain,
    home: paths.home
  }
}

module.exports = {
  interpolateVariables,
  getDeploymentVariables
}
