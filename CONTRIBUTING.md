# Contributing to AI Study Assistant

Thank you for your interest in contributing to AI Study Assistant! This document provides guidelines and instructions for contributing to the project.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)

---

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please:
- Be respectful and professional in all interactions
- Welcome and respect all perspectives
- Focus on constructive criticism
- Report inappropriate behavior to maintainers

---

## Getting Started

### 1. Fork the Repository
```bash
git clone https://github.com/your-username/AI-Study-Assistant.git
cd AI-Study-Assistant
git remote add upstream https://github.com/prudhvi-1618/AI-Study-Assistant.git
```

### 2. Setup Development Environment
Follow the [QUICKSTART.md](./QUICKSTART.md) guide to setup your local environment.

### 3. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
# or
git checkout -b docs/documentation-update
```

---

## Development Workflow

### Before Starting
1. Check [GitHub Issues](https://github.com/prudhvi-1618/AI-Study-Assistant/issues) for existing work
2. Open an issue first for major changes
3. Discuss the approach with maintainers

### Development Process
1. **Make Changes**: Edit code following [Coding Standards](#coding-standards)
2. **Test Locally**: Verify your changes work
3. **Write Tests**: Add tests for new functionality
4. **Update Docs**: Update README/docs if needed
5. **Commit**: Follow [Commit Message](#commit-messages) format

### Testing
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Lint checks
npm run lint

# Type checking
npm run type-check
```

---

## Coding Standards

### TypeScript
- Use strict mode: `"strict": true` in tsconfig.json
- Add type annotations for function parameters and returns
- Avoid `any` type - use proper typing instead
- Use interfaces for object types

**Example:**
```typescript
//  Good
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

function getUserProfile(userId: string): Promise<UserProfile> {
  // implementation
}

// Avoid
function getUser(id: any): any {
  // implementation
}
```

### React/Frontend
- Use functional components with hooks
- Keep components focused and reusable
- Use proper TypeScript types for props
- Follow React best practices

**Example:**
```typescript
//  Good
interface CardProps {
  title: string;
  description: string;
  onClick: () => void;
}

export const Card: React.FC<CardProps> = ({
  title,
  description,
  onClick,
}) => {
  return (
    <div onClick={onClick}>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
};
```

### Backend/Node.js
- Use async/await instead of callbacks
- Proper error handling with try-catch
- Use consistent logging (logger.info, logger.error, etc.)
- Validate inputs with Zod schemas

**Example:**
```typescript
//  Good
async function uploadDocument(
  userId: string,
  file: Express.Multer.File,
): Promise<Document> {
  try {
    const schema = z.object({
      userId: z.string().uuid(),
      filename: z.string().min(1),
    });

    schema.parse({ userId, filename: file.originalname });

    // Processing logic
    const document = await processDocument(userId, file);
    return document;
  } catch (error) {
    logger.error('Document upload failed', { error, userId });
    throw new BadRequestError('Invalid document');
  }
}
```

### Naming Conventions
- **Variables/Functions**: camelCase
- **Classes/Interfaces**: PascalCase
- **Constants**: UPPER_SNAKE_CASE
- **Files**: kebab-case (components), camelCase (utilities)

```typescript
//  Good naming
const MAX_RETRIES = 3;
const userData = fetchUserData();

class DocumentProcessor {
  processDocument() {}
}

interface UserProfile {}

const calculateEmbedding = async () => {};
```

### Comments & Documentation
- Add JSDoc comments for functions
- Explain "why" not just "what"
- Keep comments up-to-date

```typescript
/**
 * Generates embeddings for document chunks using the specified model.
 * Splits large batches to respect API rate limits.
 *
 * @param chunks - Array of text chunks to embed
 * @param model - Embedding model to use
 * @returns Array of embedding vectors
 * @throws {EmbeddingError} If embedding API fails
 */
async function generateEmbeddings(
  chunks: string[],
  model: string,
): Promise<number[][]> {
  // Implementation
}
```

---

## Commit Messages

Use clear, descriptive commit messages following this format:

```
[type]: [scope] - [subject]

[body]

[footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring without feature change
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, etc.

### Examples
```bash
# Good commit messages
git commit -m "feat: add adaptive quiz difficulty adjustment"
git commit -m "fix: resolve chat agent context truncation issue"
git commit -m "docs: update RAG retrieval pipeline documentation"
git commit -m "refactor: optimize vector search performance"
```

---

## Pull Request Process

### Before Submitting
1. **Update your branch** with latest main:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run tests and lint**:
   ```bash
   npm test
   npm run lint
   npm run type-check
   ```

3. **Update documentation** if needed

### PR Title & Description

Use descriptive title:
```
[Feature] Add adaptive quiz difficulty adjustment
```

Include in description:
```markdown
## Description
Briefly describe the changes

## Motivation
Why these changes are needed

## Related Issues
Closes #123

## Testing
How to test these changes

## Screenshots (if UI changes)
Add relevant screenshots

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No new warnings generated
```

### Review Process
1. One or more maintainers will review your PR
2. Address feedback and update code
3. Maintainers will merge when ready

---

## Reporting Bugs

### Bug Report Template
```markdown
## Description
Clear description of the bug

## Steps to Reproduce
1. First step
2. Second step
3. Bug occurs

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., macOS 13]
- Node.js version: [e.g., 20.0]
- Browser: [e.g., Chrome 120]

## Screenshots
If applicable, add screenshots

## Logs
Include relevant error messages
```

---

## Feature Requests

### Feature Request Template
```markdown
## Description
Clear description of the desired feature

## Problem
The problem it solves

## Proposed Solution
How it should work

## Alternative Solutions
Other approaches considered

## Additional Context
Any other relevant information
```

---

## Documentation

### Update README if:
- Adding new features
- Changing setup instructions
- Modifying API endpoints

### Update Docs if:
- Changing system architecture
- Adding new database tables
- Modifying configuration

---

## Areas for Contribution

### Frontend
- UI/UX improvements
- New components
- Performance optimization
- Accessibility enhancements

### Backend
- API optimization
- New AI agents
- Database optimizations
- Error handling improvements

### Documentation
- Tutorials
- API documentation
- Deployment guides
- Architecture diagrams

### Testing
- Unit tests
- Integration tests
- End-to-end tests
- Performance tests

---

## Questions & Support

- **GitHub Discussions**: [Ask questions](https://github.com/prudhvi-1618/AI-Study-Assistant/discussions)
- **Issues**: [Report bugs](https://github.com/prudhvi-1618/AI-Study-Assistant/issues)
- **Email**: [Contact maintainers](mailto:maintainers@example.com)

---

## Thank You!

Your contributions help make AI Study Assistant better for everyone. We appreciate your effort and support!

Happy coding!
