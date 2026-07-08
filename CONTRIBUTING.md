# Contributing to WholesaleHub

Thank you for contributing to **WholesaleHub**! To maintain a clean, consistent, and high-quality codebase, please follow these guidelines.

---

# Workflow

1. Pull the latest changes from the `develop` branch.
2. Create a new feature branch.

### Example

```bash
git checkout develop
git pull origin develop
git checkout -b feature/user-registration
```

3. Complete the assigned GitHub Issue.
4. Commit your changes using meaningful commit messages.
5. Push your branch to GitHub.
6. Open a Pull Request targeting the `develop` branch.
7. Wait for code review before merging.

---

# Branch Strategy

| Branch | Purpose |
|---------|---------|
| `main` | Production-ready code |
| `develop` | Integration branch for the current sprint |
| `feature/*` | New features |
| `bugfix/*` | Bug fixes |
| `hotfix/*` | Critical production fixes |

---

# Branch Naming

Use descriptive branch names.

### Examples

```text
feature/jwt-authentication
feature/product-api
feature/order-service
bugfix/login-validation
hotfix/payment-timeout
```

---

# Commit Message Format

Write clear and descriptive commit messages.

### Examples

```text
feat: implement user registration
feat: add JWT authentication
fix: resolve login validation bug
refactor: improve product service
docs: update API documentation
```

---

# Coding Standards

Please ensure that your code follows these guidelines:

- Write clean, readable, and maintainable code.
- Follow NestJS best practices.
- Keep controllers thin and business logic inside services.
- Use environment variables for secrets and configuration.
- Validate all incoming data.
- Write reusable and modular code.
- Keep functions focused on a single responsibility.
- Remove unused code before creating a Pull Request.

---

# Pull Requests

Before opening a Pull Request, ensure that you have:

- [ ] Successfully built the project.
- [ ] Tested your changes.
- [ ] Resolved any merge conflicts.
- [ ] Updated documentation if necessary.
- [ ] Referenced the related GitHub Issue.

### Example

```text
Closes #12
```

---

# Code Reviews

All code **must be reviewed** before being merged into the `develop` branch.

A reviewer may:

- ✅ Approve the Pull Request
- 🔄 Request changes
- 💡 Suggest improvements

Please address all requested changes before requesting another review.

---

# Communication

If you are blocked for more than **one day**, notify the project maintainer through:

- GitHub Issues
- GitHub Discussions (if enabled)
- The team's communication channel

Early communication helps prevent delays.

---

# Questions

If anything is unclear, please create a GitHub Issue or contact the project maintainer **before implementing major changes**.

---

Thank you for contributing to **WholesaleHub**! 🚀
