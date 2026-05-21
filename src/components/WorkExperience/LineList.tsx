import clsx from 'clsx'
import EditableField from '@/components/EditableField'

type Line = { text: string; bulletPoint?: boolean }

function LineList({
  lines = [],
  className = '',
  yamlBasePath = '',
  bulletGap = 0,
}: {
  lines?: Line[]
  className?: string
  yamlBasePath?: string
  bulletGap?: number
}) {
  const lines_ = lines.length > 0 ? lines : [{ text: '', bulletPoint: true }]
  return (
    <ul
      className={clsx('flex flex-col p-0 m-0', className)}
      style={bulletGap ? { gap: `${bulletGap}px` } : undefined}
    >
      {lines_.map((line, line_index) => {
        const showBullet = line.bulletPoint !== false
        const yamlPath = yamlBasePath ? `${yamlBasePath}.lines.${line_index}.text` : ''

        return (
          <li
            key={line.text}
            className={clsx('text-base', {
              'list-disc ml-6 [&>div]:block': showBullet,
              'list-none': !showBullet,
            })}
          >
            {yamlPath ? (
              <EditableField yamlPath={yamlPath} value={line.text} fieldType="textarea">
                <div>{line.text}</div>
              </EditableField>
            ) : (
              <div>{line.text}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export default LineList
