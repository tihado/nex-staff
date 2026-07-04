<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->


# Ultracite Code Standards

This project uses **Ultracite**, a zero-config preset that enforces strict code quality standards through automated formatting and linting.

## Quick Reference

- **Format code**: `pnpm dlx ultracite fix`
- **Check for issues**: `pnpm dlx ultracite check`
- **Diagnose setup**: `pnpm dlx ultracite doctor`

Biome (the underlying engine) provides robust linting and formatting. Most issues are automatically fixable.

---

## Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use meaningful variable names instead of magic numbers - extract constants with descriptive names

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access
- Prefer template literals over string concatenation
- Use destructuring for object and array assignments
- Use `const` by default, `let` only when reassignment is needed, never `var`

### Async & Promises

- Always `await` promises in async functions - don't forget to use the return value
- Use `async/await` syntax instead of promise chains for better readability
- Handle errors appropriately in async code with try-catch blocks
- Don't use async functions as Promise executors

### React & JSX

- Use function components over class components
- Call hooks at the top level only, never conditionally
- Specify all dependencies in hook dependency arrays correctly
- Use the `key` prop for elements in iterables (prefer unique IDs over array indices)
- Nest children between opening and closing tags instead of passing as props
- Don't define components inside other components
- Use semantic HTML and ARIA attributes for accessibility:
  - Provide meaningful alt text for images
  - Use proper heading hierarchy
  - Add labels for form inputs
  - Include keyboard event handlers alongside mouse events
  - Use semantic elements (`<button>`, `<nav>`, etc.) instead of divs with roles

### Error Handling & Debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code
- Throw `Error` objects with descriptive messages, not strings or other values
- Use `try-catch` blocks meaningfully - don't catch errors just to rethrow them
- Prefer early returns over nested conditionals for error cases

### Code Organization

- Keep functions focused and under reasonable cognitive complexity limits
- Extract complex conditions into well-named boolean variables
- Use early returns to reduce nesting
- Prefer simple conditionals over nested ternary operators
- Group related code together and separate concerns

### Security

- Add `rel="noopener"` when using `target="_blank"` on links
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary
- Don't use `eval()` or assign directly to `document.cookie`
- Validate and sanitize user input

### Performance

- Avoid spread syntax in accumulators within loops
- Use top-level regex literals instead of creating them in loops
- Prefer specific imports over namespace imports
- Avoid barrel files (index files that re-export everything)
- Use proper image components (e.g., Next.js `<Image>`) over `<img>` tags

### Framework-Specific Guidance

**Next.js:**
- Use Next.js `<Image>` component for images
- Use `next/head` or App Router metadata API for head elements
- Use Server Components for async data fetching instead of async Client Components

**React 19+:**
- Use ref as a prop instead of `React.forwardRef`

**Solid/Svelte/Vue/Qwik:**
- Use `class` and `for` attributes (not `className` or `htmlFor`)

---

## Testing

- Write assertions inside `it()` or `test()` blocks
- Avoid done callbacks in async tests - use async/await instead
- Don't use `.only` or `.skip` in committed code
- Keep test suites reasonably flat - avoid excessive `describe` nesting

## When Biome Can't Help

Biome's linter will catch most issues automatically. Focus your attention on:

1. **Business logic correctness** - Biome can't validate your algorithms
2. **Meaningful naming** - Use descriptive names for functions, variables, and types
3. **Architecture decisions** - Component structure, data flow, and API design
4. **Edge cases** - Handle boundary conditions and error states
5. **User experience** - Accessibility, performance, and usability considerations
6. **Documentation** - Add comments for complex logic, but prefer self-documenting code

---

Most formatting and common issues are automatically fixed by Biome. Run `pnpm dlx ultracite fix` before committing to ensure compliance.

## Cursor Cloud specific instructions

Standard commands live in `README.md` and `package.json` scripts (`pnpm dev`, `pnpm lint`, `pnpm build`, `pnpm db:*`). The notes below only cover the non-obvious cloud setup.

### Local database (no external Neon)
The app's runtime uses the `@neondatabase/serverless` **neon-http** driver, which always POSTs SQL to `https://api.<host>/sql`. There is no real Neon instance in the cloud VM, so a local stack is provided:

- **Postgres 16** runs locally (role `neon` / password `neon`, database `nexstaff`).
- A tiny **Neon HTTP protocol proxy** lives at `/opt/neon-proxy/server.js` and listens on `https://api.neonlocal.internal:443/sql`, forwarding to local Postgres. It uses a self-signed cert (`/opt/neon-proxy/cert.pem`).
- `/etc/hosts` maps `db.neonlocal.internal` and `api.neonlocal.internal` to `127.0.0.1`.

Start the stack (idempotent) with:

```bash
/opt/neon-proxy/start-db-stack.sh
```

`.env.local` (gitignored) is already configured with:
```
DATABASE_URL=postgresql://neon:neon@db.neonlocal.internal:5432/nexstaff
BETTER_AUTH_SECRET=local-dev-better-auth-secret-000000000000
SANDBOX_DISABLED=true
```
If `.env.local` is missing, recreate it with those three lines.

### Critical gotchas
- **`NODE_EXTRA_CA_CERTS` is required.** Any process that talks to the DB via the app's neon-http client (the dev server, `pnpm db:seed`, scripts) must trust the proxy cert. Run the dev server as:
  ```bash
  NODE_EXTRA_CA_CERTS=/opt/neon-proxy/cert.pem pnpm dev
  ```
  Without it you get `fetch failed` / self-signed cert errors.
- **`pnpm db:push` / `pnpm db:migrate` do NOT work against the proxy.** drizzle-kit uses the Neon serverless **WebSocket** driver, which the HTTP proxy does not serve. Apply schema changes by running the generated SQL directly:
  ```bash
  pnpm db:generate   # writes SQL to drizzle/migrations/ (no DB needed)
  PGPASSWORD=neon psql -h 127.0.0.1 -U neon -d nexstaff -f drizzle/migrations/<file>.sql
  ```
  The current schema is already applied. `pnpm db:seed` (neon-http, just a connectivity check) works fine with `NODE_EXTRA_CA_CERTS` set.
- **Dependency install:** use `pnpm install --ignore-scripts`. The `prepare` script runs `lefthook install`, which fails because Cursor manages `core.hooksPath`. `--ignore-scripts` avoids that non-fatal failure and does not skip any needed dependency builds (platform binaries come via optional deps).

### What runs without secrets vs. what needs them
- Works now: auth (email/password signup + login), the reception/home page, `/api/health`, and all pages that don't invoke the model.
- Needs `GOOGLE_GENERATIVE_AI_API_KEY` (Google AI Studio): the core AI features — Assistant chat, hiring staff, and delegating tasks (`staffTaskWorkflow`). Add it to the environment/secrets, then it is picked up via `.env.local`/`process.env`.
- Needs `BLOB_READ_WRITE_TOKEN` (Vercel Blob): document upload and staff deliverable persistence.
- The Vercel Workflow engine runs embedded in `pnpm dev` (no separate service). Vercel Sandbox is bypassed via `SANDBOX_DISABLED=true`.
