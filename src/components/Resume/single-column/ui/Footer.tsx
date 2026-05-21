import Separator from '@/components/Separator/Separator'
import ProfileLink from '@/src/components/Profile/ProfileLink/ProfileLink'
import type { CVData } from '@/types'

export default function Footer({ data }: { data: CVData }) {
  // Defensive check: ensure profile and links exist
  if (!data.profile || !data.profile.links || !Array.isArray(data.profile.links)) {
    console.warn('Footer component received invalid profile data:', data.profile)
    return null
  }

  const { links } = data.profile
  const iconOrder = ['GitHub', 'LinkedIn', 'Bluesky']
  const footerLinks = iconOrder
    .map((icon) => links.find((link) => link.icon === icon))
    .filter((link): link is { icon: string; link: string; name: string } =>
      Boolean(link?.icon && link.link && link.name),
    )

  return (
    <>
      <Separator className="" />
      <footer
        className="flex justify-center gap-x-4"
        style={{ paddingTop: `${data.layout?.spacing?.footer?.paddingTop ?? 8}px` }}
      >
        {footerLinks.map((link, _index) => {
          // Find the original index in the links array for proper YAML path
          const originalIndex = links.findIndex((l) => l.icon === link.icon && l.link === link.link)
          return (
            <ProfileLink
              key={`${link.icon}-${link.link}`}
              {...link}
              nameYamlPath={`profile.links.${originalIndex}.name`}
              linkYamlPath={`profile.links.${originalIndex}.link`}
            />
          )
        })}
      </footer>
    </>
  )
}
