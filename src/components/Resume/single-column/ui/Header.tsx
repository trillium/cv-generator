import EditableField from '@/components/EditableField/EditableField'
import ProfileLink from '@/components/Profile/ProfileLink/ProfileLink'
import type { CVData, InfoLink } from '@/types'

function resolveInfoLink(value: unknown): { link: string; name: string } {
  if (typeof value === 'string') return { link: value, name: value }
  if (value && typeof value === 'object' && 'link' in value && 'name' in value) {
    return {
      link: String((value as { link: unknown }).link),
      name: String((value as { name: unknown }).name),
    }
  }
  return { link: '', name: '' }
}

function isInfo(obj: Record<string, unknown>): obj is {
  firstName: string
  lastName: string
  email: string
  phone: string
  website: InfoLink
  bluesky?: InfoLink
  role?: string
} {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof (obj as Record<string, unknown>).firstName === 'string' &&
    typeof (obj as Record<string, unknown>).lastName === 'string' &&
    typeof (obj as Record<string, unknown>).email === 'string' &&
    typeof (obj as Record<string, unknown>).phone === 'string' &&
    (typeof (obj as Record<string, unknown>).website === 'string' ||
      (typeof (obj as Record<string, unknown>).website === 'object' &&
        (obj as Record<string, unknown>).website !== null))
  )
}

export default function Header({ data }: { data: CVData }) {
  const infoIsValid = isInfo(data.info as Record<string, unknown>)
  const firstName = infoIsValid ? String(data.info.firstName) : ''
  const lastName = infoIsValid ? String(data.info.lastName) : ''
  const role = infoIsValid ? String(data.info.role ?? '') : ''
  const email = infoIsValid ? String(data.info.email) : ''
  const website = infoIsValid ? resolveInfoLink(data.info.website) : { link: '', name: '' }
  const github = infoIsValid
    ? resolveInfoLink((data.info as Record<string, unknown>).github)
    : { link: '', name: '' }
  const bluesky = infoIsValid
    ? resolveInfoLink((data.info as Record<string, unknown>).bluesky)
    : { link: '', name: '' }
  const linkedIn = infoIsValid
    ? resolveInfoLink((data.info as Record<string, unknown>).linkedIn)
    : { link: '', name: '' }

  if (!infoIsValid) return null

  return (
    <header>
      <div className="text-center">
        <h1 className="text-4xl inline-block">
          <EditableField yamlPath="info.firstName" value={firstName} fieldType="text">
            <span className="font-semibold text-primary-500">{firstName}</span>
          </EditableField>{' '}
          <EditableField yamlPath="info.lastName" value={lastName} fieldType="text">
            <span className="font-normal dark:text-white">{lastName}</span>
          </EditableField>
        </h1>
        <span className="inline-block font-light border-l-2 border-black dark:border-white px-3 text-primary-500 dark:text-gray-300 text-4xl align-baseline ml-3">
          <EditableField yamlPath="info.role" value={role || ''} fieldType="text">
            <span className="dark:text-gray-300">{role}</span>
          </EditableField>
        </span>
      </div>
      <div
        className="text-center"
        style={{ paddingTop: `${data.layout?.spacing?.header?.contactPaddingTop ?? 8}px` }}
      >
        <EditableField yamlPath="info.email" value={email} fieldType="text">
          <span className="inline-block mr-4">
            <ProfileLink
              icon="Email"
              link={email}
              name="Email"
              linkYamlPath="info.email"
              nameYamlPath="info.email"
            />
          </span>
        </EditableField>
        <EditableField yamlPath="info.website" value={website.link} fieldType="text">
          <span className="inline-block mr-4">
            <ProfileLink
              icon="Website"
              link={website.link}
              name={website.name}
              linkYamlPath="info.website.link"
              nameYamlPath="info.website.name"
            />
          </span>
        </EditableField>
        {github.link && (
          <EditableField yamlPath="info.github" value={github.link} fieldType="text">
            <span className="inline-block mr-4">
              <ProfileLink
                icon="GitHub"
                link={github.link}
                name={github.name}
                linkYamlPath="info.github.link"
                nameYamlPath="info.github.name"
              />
            </span>
          </EditableField>
        )}
        {linkedIn.link && (
          <EditableField yamlPath="info.linkedIn" value={linkedIn.link} fieldType="text">
            <span className="inline-block mr-4">
              <ProfileLink
                icon="LinkedIn"
                link={linkedIn.link}
                name={linkedIn.name}
                linkYamlPath="info.linkedIn.link"
                nameYamlPath="info.linkedIn.name"
              />
            </span>
          </EditableField>
        )}
        {bluesky.link && (
          <EditableField yamlPath="info.bluesky" value={bluesky.link} fieldType="text">
            <span className="inline-block">
              <ProfileLink
                icon="Bluesky"
                link={bluesky.link}
                name={bluesky.name}
                linkYamlPath="info.bluesky.link"
                nameYamlPath="info.bluesky.name"
              />
            </span>
          </EditableField>
        )}
      </div>
    </header>
  )
}
