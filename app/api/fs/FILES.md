# File structure

All routes area clean, they have basic GET POST PUT DELTE methods only, barely any defined logic inside the files themselves.

If there needs to be any utility function logic, that function goes in the same directory next to the route file

Each utility function is its own standalone file

Example:

```
Directory structure:
└── fs/
     ├── FILES.md
     ├── get-files/
     │    └── route.ts
     ├── route.ts
     └── writeFile.ts # this file is a utility function for route.ts
```
