1. ✅ DONE - FileManagerFeature search: {hasChildren ? (isExpanded ? "▼" : "▶") : "○"}

Change these to some sort of react-icons icon please

2. ✅ DONE - Extend all file types of the CVData (eg work experience, etc) to accept an optional notes array of type string

3. ✅ DONE - Stage and commit all the files in semantic parts that are still uncommitted

4. ✅ DONE - Go through and replace all instances of file based imports eg path of "../../someFile" to @ style imports

5. ✅ DONE - The user needs a way to create a new directory or to split out a key of the resume file. Develop a system to do that and integrate it.

System should allow a section to be moved out of the larger data file (eg data.yml, copy existing info off of data.info into info.yml)

System should allow generation of a new directory (sub dir or sibling dir)

System should allow deletion of any file

Deleted files are moved to a `deleted` folder where they are stored. They should be stored in their subflder eg `base/google/data.` should be deleted into `deleted/base/google/data.yml`
