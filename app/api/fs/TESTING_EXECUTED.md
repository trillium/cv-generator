# TESTING COMMAND

`pnpm test app/api/fs`

## Current results:

```bash

> pdf-generator@0.0.0 test /Users/trilliumsmith/code/cv-generator/cv-generator
> vitest run app/api/fs


 RUN  v3.2.4 /Users/trilliumsmith/code/cv-generator/cv-generator

 ✓ app/api/fs/moveFile.test.ts (6 tests) 4ms
 ❯ app/api/fs/deleteFile.test.ts (6 tests | 5 failed) 11ms
   × deleteFile utility function > should delete existing file successfully 5ms
     → expected "unlink" to be called with arguments: [ '/base/path/test.yml' ][90m

Number of calls: [1m0[22m
[39m
   × deleteFile utility function > should create backup before deletion when requested 1ms
     → expected "mkdir" to be called with arguments: [ '/base/path/diffs', …(1) ][90m

Number of calls: [1m0[22m
[39m
   ✓ deleteFile utility function > should fail when file does not exist 0ms
   × deleteFile utility function > should handle deletion errors gracefully 2ms
     → expected true to be false // Object.is equality
   × deleteFile utility function > should continue deletion even if backup creation fails 1ms
     → expected true to be false // Object.is equality
   × deleteFile utility function > should use default base directory from environment 0ms
     → expected "unlink" to be called with arguments: [ '/default/pii/path/test.yml' ][90m

Number of calls: [1m0[22m
[39m
 ❯ app/api/fs/copyFile.test.ts (7 tests | 5 failed) 14ms
   × copyFile utility function > should copy file successfully 6ms
     → expected "readFile" to be called with arguments: [ '/base/path/source.yml', 'utf-8' ][90m

Number of calls: [1m0[22m
[39m
   × copyFile utility function > should create destination directory if it does not exist 2ms
     → expected "mkdir" to be called with arguments: [ '/base/path/deep/nested', …(1) ][90m

Number of calls: [1m0[22m
[39m
   ✓ copyFile utility function > should fail when source file does not exist 1ms
   ✓ copyFile utility function > should fail when destination exists and overwrite is false 0ms
   × copyFile utility function > should overwrite when destination exists and overwrite is true 1ms
     → expected "writeFile" to be called with arguments: [ '/base/path/existing.yml', …(2) ][90m

Number of calls: [1m0[22m
[39m
   × copyFile utility function > should handle read/write errors gracefully 2ms
     → expected true to be false // Object.is equality
   × copyFile utility function > should use default base directory from environment 0ms
     → expected "readFile" to be called with arguments: [ Array(2) ][90m

Number of calls: [1m0[22m
[39m
 ❯ app/api/fs/get-files/readFiles.test.ts (8 tests | 8 failed) 7ms
   × readFiles utility function > should read and parse YAML files correctly 4ms
     → mockFs.readFile.mockResolvedValue is not a function
   × readFiles utility function > should read and parse JSON files correctly 0ms
     → mockFs.readFile.mockResolvedValue is not a function
   × readFiles utility function > should return raw content for non-JSON/YAML files 0ms
     → mockFs.readFile.mockResolvedValue is not a function
   × readFiles utility function > should handle YAML parsing errors gracefully 0ms
     → mockFs.readFile.mockResolvedValue is not a function
   × readFiles utility function > should handle file read errors gracefully 0ms
     → mockFs.readFile.mockRejectedValue is not a function
   × readFiles utility function > should process multiple files with mixed types 0ms
     → mockFs.readFile.mockResolvedValueOnce is not a function
   × readFiles utility function > should handle .yaml extension files 0ms
     → mockFs.readFile.mockResolvedValue is not a function
   × readFiles utility function > should handle malformed JSON gracefully 0ms
     → mockFs.readFile.mockResolvedValue is not a function
 ❯ app/api/fs/writeFile.test.ts (6 tests | 6 failed) 14ms
   × writeFile utility function > should write JSON as YAML to file system 6ms
     → expected "writeFile" to be called with arguments: [ '/base/path/test/data.yml', …(2) ][90m

Number of calls: [1m0[22m
[39m
   × writeFile utility function > should create directory if it does not exist 1ms
     → expected "mkdir" to be called with arguments: [ '/base/path/deep/nested', …(1) ][90m

Number of calls: [1m0[22m
[39m
   × writeFile utility function > should detect existing files 1ms
     → expected "readFile" to be called with arguments: [ '/base/path/existing.yml', 'utf-8' ][90m

Number of calls: [1m0[22m
[39m
   × writeFile utility function > should create diff when content changes 2ms
     → expected "mkdir" to be called with arguments: [ '/base/path/diffs', …(1) ][90m

Number of calls: [1m0[22m
[39m
   × writeFile utility function > should handle write errors gracefully 2ms
     → expected true to be false // Object.is equality
   × writeFile utility function > should use default base directory from environment 0ms
     → expected "writeFile" to be called with arguments: [ '/default/pii/path/test.yml', …(2) ][90m

Number of calls: [1m0[22m
[39m

 Test Files  5 failed | 1 passed (6)
      Tests  24 failed | 9 passed (33)
   Start at  13:16:07
   Duration  810ms (transform 212ms, setup 372ms, collect 309ms, tests 49ms, environment 2.06s, prepare 559ms)

 ELIFECYCLE  Test failed. See above for more details.
```
