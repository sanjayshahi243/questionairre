# Service name (adjust if different for local/production)
LOCAL_SERVICE = django
PROD_SERVICE = django

# Docker Compose files
LOCAL_COMPOSE_FILE = docker-compose.local.yml
PROD_COMPOSE_FILE = docker-compose.production.yml

# Default environment (local or production)
ENV ?= local

# Set the Docker Compose file and service based on the environment
ifeq ($(ENV),production)
    COMPOSE_FILE = $(PROD_COMPOSE_FILE)
    SERVICE_NAME = $(PROD_SERVICE)
else
    COMPOSE_FILE = $(LOCAL_COMPOSE_FILE)
    SERVICE_NAME = $(LOCAL_SERVICE)
endif

# Help target
.PHONY: help
help:
	@echo "Usage: make [target] ENV=<environment>"
	@echo ""
	@echo "Environment (default: local):"
	@echo "  local          Use the local Docker Compose configuration"
	@echo "  production     Use the production Docker Compose configuration"
	@echo ""
	@echo "Targets:"
	@echo "  compose_up        Build and Run docker services using compose"
	@echo "  makemigrations    Run makemigrations inside the container"
	@echo "  migrate           Run migrations inside the container"
	@echo "  logs              Show logs for the service (default: last 100 lines)"
	@echo "                    Example: make logs LOG_LINES=200 ENV=production"
	@echo "  shell             Open a python shell inside the service container"
	@echo "  bash              Open a bash terminal inside the service container"


# Run Compose and build
.PHONY: compose_up
compose_up:
	docker compose -f $(COMPOSE_FILE) up --build

# Run makemigrations
.PHONY: makemigrations
makemigrations:
	docker compose -f $(COMPOSE_FILE) run --rm $(SERVICE_NAME) python manage.py makemigrations

# Run migrations
.PHONY: migrate
migrate:
	docker compose -f $(COMPOSE_FILE) run --rm $(SERVICE_NAME) python manage.py migrate

# Show service logs
.PHONY: logs
logs:
	docker compose -f $(COMPOSE_FILE) logs --tail=$(LOG_LINES) -f $(SERVICE_NAME)

# Open python shell inside the container
.PHONY: shell
shell:
	docker compose -f $(COMPOSE_FILE) exec $(SERVICE_NAME) bash -c "source /entrypoint && set +euo pipefail && python manage.py shell"

# Open bash terminal inside the container
.PHONY: bash
bash:
	docker compose -f $(COMPOSE_FILE) exec $(SERVICE_NAME) bash -c "source /entrypoint && set +euo pipefail && bash"

# Default number of log lines
LOG_LINES ?= 100