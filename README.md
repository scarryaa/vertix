# STEPS
1. Create .envrc with content 'use flake' and 'export DATABASE_URL="postgresql://username:password@localhost:5432/db?schema=public"'
2. Run "prisma generate"
3. run 'pnpm start'