import { useLinkedInData } from '@/contexts/LinkedInContext'
import { createYamlDocument, documentToString, parseYamlString } from '@/lib/yamlService'

export function getNestedValue(obj: unknown, path: string): unknown {
  const keys = path.split('.')
  let current: unknown = obj

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined
    }

    if (!Number.isNaN(Number(key))) {
      const index = Number(key)
      if (Array.isArray(current)) {
        current = current[index]
      } else {
        return undefined
      }
    } else {
      current = (current as Record<string, unknown>)[key]
    }
  }

  return current
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown) {
  const keys = path.split('.')
  let current: unknown = obj

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]

    if (!Number.isNaN(Number(key))) {
      const index = Number(key)
      if (!Array.isArray(current)) {
        throw new Error(`Expected array at path segment "${keys.slice(0, i + 1).join('.')}"`)
      }
      current = current[index]
    } else {
      const currentObj = current as Record<string, unknown>
      if (currentObj[key] === undefined) {
        const nextKey = keys[i + 1]
        currentObj[key] = !Number.isNaN(Number(nextKey)) ? [] : {}
      }
      current = currentObj[key]
    }
  }

  const lastKey = keys[keys.length - 1]
  if (!Number.isNaN(Number(lastKey))) {
    const index = Number(lastKey)
    if (Array.isArray(current)) {
      current[index] = value
    } else {
      throw new Error(`Expected array at path "${path}"`)
    }
  } else {
    ;(current as Record<string, unknown>)[lastKey] = value
  }
}

export function useLinkedInYamlUpdater() {
  const { yamlContent, updateYamlContent, currentLinkedInFile } = useLinkedInData()

  const updateYamlPath = async (path: string, newValue: unknown) => {
    try {
      console.log(`🎯 useLinkedInYamlUpdater.updateYamlPath called with:`, {
        path,
        newValue,
        currentLinkedInFile,
        yamlContentLength: yamlContent.length,
      })

      const data = parseYamlString(yamlContent)
      console.log('📋 Parsed current YAML data:', data)

      setNestedValue(data, path, newValue)
      console.log('🔄 Updated data after setNestedValue:', data)

      const doc = createYamlDocument(data)
      const updatedYaml = documentToString(doc)
      console.log('📄 Generated updated YAML:', {
        length: updatedYaml.length,
        preview: `${updatedYaml.substring(0, 200)}...`,
      })

      console.log('🚀 Calling updateYamlContent...')
      await updateYamlContent(updatedYaml)

      console.log(`✅ YAML path "${path}" updated successfully`)
    } catch (error) {
      console.error('❌ Error updating YAML path:', path, error)
      throw error
    }
  }

  return {
    updateYamlPath,
    currentContext: currentLinkedInFile
      ? {
          filePath: currentLinkedInFile,
          fileName:
            currentLinkedInFile
              .split('/')
              .pop()
              ?.replace(/\.(yml|yaml)$/i, '') || 'linkedin',
        }
      : null,
    isFileBasedMode: !!currentLinkedInFile,
  }
}
