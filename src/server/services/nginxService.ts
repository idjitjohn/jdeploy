import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { executeSudo } from '../utils/sudo'
import ConfigurationModel from '../models/configuration'

interface Paths {
    nginxAvailable: string
    nginxEnabled: string
    home: string
}

export const getNginxPaths = async (): Promise<Paths> => {
    const pathsConfig = await ConfigurationModel.findOne({ key: 'paths' })

    if (!pathsConfig) {
        throw new Error('Paths configuration not found')
    }

    return pathsConfig.value
}

export const getNginxFilename = (repoName: string): string => {
    return `${repoName}.conf`
}

export const nginxExists = async (repoName: string): Promise<boolean> => {
    const paths = await getNginxPaths()
    const filename = getNginxFilename(repoName)
    const enabledPath = path.join(paths.nginxEnabled, filename)

    return fs.existsSync(enabledPath)
}

interface RepoConfig {
    name: string
    domain: string
    port: number
}

export const generateNginxConfig = (repoConfig: RepoConfig, nginxTemplate: string[], paths: Paths): string => {
    const variables: Record<string, string> = {
        '$name$': repoConfig.name,
        '$domain$': repoConfig.domain,
        '$port$': String(repoConfig.port),
        '$home$': paths.home,
    }

    return nginxTemplate.map(line => {
        let result = line
        Object.entries(variables).forEach(([key, value]) => {
            result = result.replace(new RegExp(key.replace('$', '\\$'), 'g'), value)
        })
        return result
    }).join('\n')
}

export const writeNginxConfig = async (repoName: string, configContent: string): Promise<string> => {
    const paths = await getNginxPaths()
    const filename = getNginxFilename(repoName)
    const availablePath = path.join(paths.nginxAvailable, filename)

    if (!fs.existsSync(paths.nginxAvailable)) {
        fs.mkdirSync(paths.nginxAvailable, { recursive: true })
    }

    fs.writeFileSync(availablePath, configContent, 'utf-8')

    return availablePath
}

export const enableNginx = async (repoName: string, sessionId: string | null = null): Promise<boolean> => {
    const paths = await getNginxPaths()
    const filename = getNginxFilename(repoName)
    const availablePath = path.join(paths.nginxAvailable, filename)
    const enabledPath = path.join(paths.nginxEnabled, filename)

    if (!fs.existsSync(availablePath)) {
        throw new Error(`Nginx config not found in available: ${availablePath}`)
    }

    if (fs.existsSync(enabledPath)) {
        return false
    }

    if (!fs.existsSync(paths.nginxEnabled)) {
        fs.mkdirSync(paths.nginxEnabled, { recursive: true })
    }

    try {
        fs.copyFileSync(availablePath, enabledPath)
        return true
    } catch (err: any) {
        if (err.code === 'EACCES' && sessionId) {
            await executeSudo(`cp ${availablePath} ${enabledPath}`, sessionId)
            return true
        }
        throw new Error(`Failed to enable nginx: ${err.message}`)
    }
}

export const disableNginx = async (repoName: string, sessionId: string | null = null): Promise<boolean> => {
    const paths = await getNginxPaths()
    const filename = getNginxFilename(repoName)
    const enabledPath = path.join(paths.nginxEnabled, filename)

    if (!fs.existsSync(enabledPath)) {
        return false
    }

    try {
        fs.unlinkSync(enabledPath)
        return true
    } catch (err: any) {
        if (err.code === 'EACCES' && sessionId) {
            await executeSudo(`rm ${enabledPath}`, sessionId)
            return true
        }
        throw new Error(`Failed to disable nginx: ${err.message}`)
    }
}

export const reloadNginx = async (sessionId: string | null = null): Promise<boolean> => {
    try {
        execSync('sudo nginx -s reload 2>/dev/null', { stdio: 'pipe' })
        return true
    } catch (err) {
        if (sessionId) {
            await executeSudo('nginx -s reload', sessionId)
            return true
        }
        throw new Error('Failed to reload nginx')
    }
}

interface NginxTestResult {
    success: boolean
    error?: string
}

export const testNginxConfig = async (sessionId: string | null = null): Promise<NginxTestResult> => {
    try {
        execSync('sudo nginx -t 2>/dev/null', { stdio: 'pipe' })
        return { success: true }
    } catch (err: any) {
        if (sessionId) {
            try {
                await executeSudo('nginx -t', sessionId)
                return { success: true }
            } catch (testErr: any) {
                return { success: false, error: testErr.message }
            }
        }
        return { success: false, error: err.message }
    }
}
