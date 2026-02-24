import { getDefaultResume, listAllResumes } from '../lib/getDefaultResume'

console.log('=== Default Resume ===')
const defaultResume = getDefaultResume()
console.log(JSON.stringify(defaultResume, null, 2))

console.log('\n=== All Resumes ===')
const allResumes = listAllResumes()
console.log(JSON.stringify(allResumes, null, 2))
