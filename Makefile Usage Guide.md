# Makefile Usage Guide

This document provides detailed instructions for using the `Makefile` to manage local and production Docker environments for your Django application. The `Makefile` simplifies running common tasks, such as managing migrations, viewing logs, and accessing the container shell.

---

## General Usage

To run any `Makefile` command:
```bash
make <target> ENV=<environment>
```
- **`ENV` (optional)**: Specifies the environment to use. Defaults to `local`.
  - `local`: Use the local Docker Compose configuration (`docker-compose.local.yml`).
  - `production`: Use the production Docker Compose configuration (`docker-compose.production.yml`).

---

## Targets

### 1. **`compose_up`**
Builds and runs the Docker services defined in the specified Compose file.

**Usage:**
```bash
make compose_up ENV=local
```
- This command will:
  - Build the Docker containers.
  - Start the services defined in the `docker-compose` file.

---

### 2. **`makemigrations`**
Runs Django’s `makemigrations` command inside the container to generate migration files.

**Usage:**
```bash
make makemigrations ENV=local
```
- This command will:
  - Run `python manage.py makemigrations` in the `django` container.

---

### 3. **`migrate`**
Runs Django’s `migrate` command inside the container to apply migrations.

**Usage:**
```bash
make migrate ENV=local
```
- This command will:
  - Run `python manage.py migrate` in the `django` container.

---

### 4. **`logs`**
Displays the service logs. By default, it shows the last 100 log lines and continues streaming logs.

**Usage:**
```bash
make logs ENV=local
```
- To specify the number of lines:
```bash
make logs LOG_LINES=200 ENV=production
```
- This command will:
  - Stream logs from the `django` container.
  - Show the specified number of log lines initially.

**Default Behavior:**
- `LOG_LINES` defaults to 100 if not specified.

---

### 5. **`shell`**
Opens a Python shell inside the service container.

**Usage:**
```bash
make shell ENV=local
```
- This command will:
  - Run `python manage.py shell` in the `django` container.

---

### 6. **`bash`**
Opens a Bash terminal inside the service container.

**Usage:**
```bash
make bash ENV=local
```
- This command will:
  - Open a Bash terminal in the `django` container.

---

## Environment Variables and Shell Commands

To ensure environment variables are accessible within the container, commands that require a shell (e.g., `shell`, `bash`) include the following:
```bash
source /entrypoint && set +euo pipefail
```
This ensures that:
1. Environment variables are sourced correctly.
2. The shell doesn’t terminate unexpectedly due to strict error handling.

---

## Example Workflows

### **Starting Local Development Environment**
```bash
make compose_up ENV=local
```

### **Generating Migrations**
```bash
make makemigrations ENV=local
```

### **Applying Migrations**
```bash
make migrate ENV=local
```

### **Viewing Logs**
```bash
make logs LOG_LINES=150 ENV=local
```

### **Accessing Python Shell**
```bash
make shell ENV=local
```

### **Accessing Bash Terminal**
```bash
make bash ENV=local
```

---

## Notes
- Adjust `SERVICE_NAME` in the `Makefile` if your Django service name is different in the Docker Compose files.
- For production use, ensure all sensitive environment variables are correctly set and loaded.

By following this guide, you can efficiently manage your Django application in both local and production environments.

