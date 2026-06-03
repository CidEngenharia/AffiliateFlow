# STATE

PROJECT:
SaaS WhatsApp MultiTenant

STACK:
Next.js
Supabase
Prisma
Tailwind
Redis

DONE:
auth
dashboard
stripe
whatsapp-webhook

TODO:
chat realtime
agent memory
voice support

NOW:
corrigir JWT refresh

FILES:
src/auth.ts
src/jwt.ts
src/middleware.ts

RULES:
TS strict
no any
mobile first
reuse components

AVOID:
full project scan
global refactor
duplicate code

BUGS:
token loop middleware

NEXT:
1 fix jwt
2 test middleware
3 deploy render