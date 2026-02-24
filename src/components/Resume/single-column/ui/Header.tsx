import EditableField from '@/components/EditableField/EditableField'
import ProfileLink from '@/components/Profile/ProfileLink/ProfileLink'
import type { CVData } from '@/types'

function isInfo(obj: Record<string, unknown>): obj is {
  firstName: string
  lastName: string
  email: string
  phone: string
  website: string
  bluesky?: string
  role?: string
} {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof (obj as Record<string, unknown>).firstName === 'string' &&
    typeof (obj as Record<string, unknown>).lastName === 'string' &&
    typeof (obj as Record<string, unknown>).email === 'string' &&
    typeof (obj as Record<string, unknown>).phone === 'string' &&
    typeof (obj as Record<string, unknown>).website === 'string'
  )
}

export default function Header({ data }: { data: CVData }) {
  const infoIsValid = isInfo(data.info as Record<string, unknown>)
  const firstName = infoIsValid ? String(data.info.firstName) : ''
  const lastName = infoIsValid ? String(data.info.lastName) : ''
  const role = infoIsValid ? String(data.info.role ?? '') : ''
  const email = infoIsValid ? String(data.info.email) : ''
  const phone = infoIsValid ? String(data.info.phone) : ''
  const website = infoIsValid ? String(data.info.website) : ''

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
        <span className="inline-block font-light border-l-2 border-black dark:border-white px-3 text-gray-700 dark:text-gray-300 text-4xl align-baseline ml-3">
          <EditableField yamlPath="info.role" value={role || ''} fieldType="text">
            <span className="dark:text-gray-300">{role}</span>
          </EditableField>
        </span>
      </div>
      <div className="text-center pt-2">
        <EditableField yamlPath="info.email" value={email} fieldType="text">
          <span className="inline-block mr-4">
            <ProfileLink
              icon="Email"
              link={email}
              name={email}
              linkYamlPath="info.email"
              nameYamlPath="info.email"
            />
          </span>
        </EditableField>
        <EditableField yamlPath="info.phone" value={phone} fieldType="text">
          <span className="inline-block mr-4">
            <ProfileLink
              icon="Phone"
              link={phone}
              name={phone}
              linkYamlPath="info.phone"
              nameYamlPath="info.phone"
            />
          </span>
        </EditableField>
        <EditableField yamlPath="info.website" value={website} fieldType="text">
          <span className="inline-block">
            <ProfileLink
              icon="Website"
              link={website}
              name={website}
              linkYamlPath="info.website"
              nameYamlPath="info.website"
            />
          </span>
        </EditableField>
      </div>
    </header>
  )
}
