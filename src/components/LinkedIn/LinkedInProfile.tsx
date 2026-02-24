import type {
  LinkedInData,
  LinkedInProfile as LinkedInProfileType,
  LinkedInRecommendation,
} from '@/types/linkedin'
import LinkedInEditableField from './LinkedInEditableField'

type LinkedInProfileProps = {
  data: LinkedInData
}

export default function LinkedInProfile({ data }: LinkedInProfileProps) {
  const profile = data.linkedIn

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800">
        <ProfileHeader profile={profile} />
        <div className="px-6 py-4">
          <AboutSection about={profile.about} />
          <ExperienceSection experiences={profile.experience} />
          <EducationSection education={profile.education} />
          {profile.skills && profile.skills.length > 0 && <SkillsSection skills={profile.skills} />}
          {profile.recommendations?.received && profile.recommendations.received.length > 0 && (
            <RecommendationsSection recommendations={profile.recommendations.received} />
          )}
          {profile.certifications && profile.certifications.length > 0 && (
            <CertificationsSection certifications={profile.certifications} />
          )}
          {profile.interests && profile.interests.length > 0 && (
            <InterestsSection interests={profile.interests} />
          )}
        </div>
      </div>
    </div>
  )
}

function ProfileHeader({ profile }: { profile: LinkedInProfileType }) {
  return (
    <div className="relative">
      <div className="h-48 bg-gradient-to-r from-blue-600 to-blue-800" />
      <div className="px-6 pb-6">
        <div className="relative -mt-20 mb-4">
          <div className="w-40 h-40 rounded-full border-4 border-white dark:border-gray-800 bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-6xl font-bold text-white">
            {profile.firstName?.[0]}
            {profile.lastName?.[0]}
          </div>
        </div>
        <div className="flex gap-2">
          <LinkedInEditableField
            yamlPath="linkedIn.firstName"
            value={profile.firstName}
            fieldType="text"
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {profile.firstName}
            </h1>
          </LinkedInEditableField>
          <LinkedInEditableField
            yamlPath="linkedIn.lastName"
            value={profile.lastName}
            fieldType="text"
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{profile.lastName}</h1>
          </LinkedInEditableField>
        </div>
        <LinkedInEditableField yamlPath="linkedIn.role" value={profile.role} fieldType="text">
          <p className="text-xl text-gray-700 dark:text-gray-300 mt-2">{profile.role}</p>
        </LinkedInEditableField>
        <LinkedInEditableField
          yamlPath="linkedIn.location"
          value={profile.location}
          fieldType="text"
        >
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{profile.location}</p>
        </LinkedInEditableField>
      </div>
    </div>
  )
}

function AboutSection({ about }: { about: string }) {
  // LinkedIn shows ~300 characters before "...more" button
  const FOLD_LIMIT = 300
  const aboveTheFold = about.slice(0, FOLD_LIMIT)
  const belowTheFold = about.slice(FOLD_LIMIT)

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 py-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">About</h2>
      <LinkedInEditableField yamlPath="linkedIn.about" value={about} fieldType="textarea">
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
          {aboveTheFold}
          {belowTheFold && (
            <span className="text-orange-500 dark:text-orange-400">{belowTheFold}</span>
          )}
        </p>
      </LinkedInEditableField>
    </div>
  )
}

function ExperienceSection({ experiences }: { experiences: LinkedInProfileType['experience'] }) {
  return (
    <div className="border-t border-gray-200 dark:border-gray-700 py-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Experience</h2>
      <div className="space-y-6">
        {experiences.map((exp, index) => (
          <div key={index} className="flex gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="flex-1">
              <LinkedInEditableField
                yamlPath={`linkedIn.experience.${index}.title`}
                value={exp.title}
                fieldType="text"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {exp.title}
                </h3>
              </LinkedInEditableField>
              <LinkedInEditableField
                yamlPath={`linkedIn.experience.${index}.company`}
                value={exp.company}
                fieldType="text"
              >
                <p className="text-md font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {exp.company}
                </p>
              </LinkedInEditableField>
              <div className="flex gap-2 text-sm text-gray-600 dark:text-gray-400">
                <LinkedInEditableField
                  yamlPath={`linkedIn.experience.${index}.startDate`}
                  value={exp.startDate}
                  fieldType="text"
                >
                  <span>{exp.startDate}</span>
                </LinkedInEditableField>
                <span>-</span>
                <LinkedInEditableField
                  yamlPath={`linkedIn.experience.${index}.endDate`}
                  value={exp.endDate}
                  fieldType="text"
                >
                  <span>{exp.endDate}</span>
                </LinkedInEditableField>
              </div>
              <LinkedInEditableField
                yamlPath={`linkedIn.experience.${index}.location`}
                value={exp.location}
                fieldType="text"
              >
                <p className="text-sm text-gray-600 dark:text-gray-400">{exp.location}</p>
              </LinkedInEditableField>
              {exp.description && (
                <LinkedInEditableField
                  yamlPath={`linkedIn.experience.${index}.description`}
                  value={exp.description}
                  fieldType="textarea"
                >
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{exp.description}</p>
                </LinkedInEditableField>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function EducationSection({ education }: { education: LinkedInProfileType['education'] }) {
  return (
    <div className="border-t border-gray-200 dark:border-gray-700 py-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Education</h2>
      <div className="space-y-6">
        {education.map((edu, index) => (
          <div key={index} className="flex gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="flex-1">
              <LinkedInEditableField
                yamlPath={`linkedIn.education.${index}.institution`}
                value={edu.institution}
                fieldType="text"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {edu.institution}
                </h3>
              </LinkedInEditableField>
              <div className="text-md text-gray-700 dark:text-gray-300">
                <LinkedInEditableField
                  yamlPath={`linkedIn.education.${index}.degree`}
                  value={edu.degree}
                  fieldType="text"
                >
                  <span>{edu.degree}</span>
                </LinkedInEditableField>
                {edu.fieldOfStudy && (
                  <>
                    <span>, </span>
                    <LinkedInEditableField
                      yamlPath={`linkedIn.education.${index}.fieldOfStudy`}
                      value={edu.fieldOfStudy}
                      fieldType="text"
                    >
                      <span>{edu.fieldOfStudy}</span>
                    </LinkedInEditableField>
                  </>
                )}
              </div>
              <div className="flex gap-2 text-sm text-gray-600 dark:text-gray-400">
                <LinkedInEditableField
                  yamlPath={`linkedIn.education.${index}.startDate`}
                  value={edu.startDate}
                  fieldType="text"
                >
                  <span>{edu.startDate}</span>
                </LinkedInEditableField>
                <span>-</span>
                <LinkedInEditableField
                  yamlPath={`linkedIn.education.${index}.endDate`}
                  value={edu.endDate}
                  fieldType="text"
                >
                  <span>{edu.endDate}</span>
                </LinkedInEditableField>
              </div>
              {edu.description && (
                <LinkedInEditableField
                  yamlPath={`linkedIn.education.${index}.description`}
                  value={edu.description}
                  fieldType="textarea"
                >
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{edu.description}</p>
                </LinkedInEditableField>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SkillsSection({ skills }: { skills: string[] }) {
  return (
    <div className="border-t border-gray-200 dark:border-gray-700 py-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Skills</h2>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, index) => (
          <span
            key={index}
            className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  )
}

function RecommendationsSection({
  recommendations,
}: {
  recommendations: LinkedInRecommendation[]
}) {
  return (
    <div className="border-t border-gray-200 dark:border-gray-700 py-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Recommendations</h2>
      <div className="space-y-6">
        {recommendations.map((rec, index) => (
          <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-shrink-0 w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-white font-semibold">
                {rec.recommender
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{rec.recommender}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{rec.recommenderTitle}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{rec.date}</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 italic">
              &ldquo;{rec.text}&rdquo;
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function CertificationsSection({
  certifications,
}: {
  certifications: LinkedInProfileType['certifications']
}) {
  return (
    <div className="border-t border-gray-200 dark:border-gray-700 py-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
        Licenses & Certifications
      </h2>
      <div className="space-y-4">
        {certifications?.map((cert, index) => (
          <div key={index}>
            <h3 className="font-semibold text-gray-900 dark:text-white">{cert.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {cert.issuer}
              {cert.date && ` · ${cert.date}`}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function InterestsSection({ interests }: { interests: string[] }) {
  return (
    <div className="border-t border-gray-200 dark:border-gray-700 py-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Interests</h2>
      <ul className="list-disc list-inside space-y-1">
        {interests.map((interest, index) => (
          <li key={index} className="text-gray-700 dark:text-gray-300">
            {interest}
          </li>
        ))}
      </ul>
    </div>
  )
}
