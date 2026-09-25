# Путь к env-файлу задаётся в одном месте — override: make -C infra up ENV_FILE=../.env.staging
ENV_FILE ?= ../.env

up:
	docker compose -f docker-compose.prod.yml --env-file $(ENV_FILE) up -d --build
ps:
	docker compose -f docker-compose.prod.yml --env-file $(ENV_FILE) ps
logs:
	docker compose -f docker-compose.prod.yml --env-file $(ENV_FILE) logs -f --tail=100
smoke:
	@docker compose -f docker-compose.prod.yml --env-file $(ENV_FILE) exec web wget -q -O- http://web:3000/api/health || true
backup:
	bash scripts/backup.sh
new-site:
	@echo "Несколько сайтов на одном сервере не поддерживаются: Caddy (80/443) и admin (3001) занимают порты, второй compose-проект не поднимется."
	@echo "Новый сайт = новый сервер: клонировать репозиторий, свой .env (SITE_DOMAIN, POSTGRES_PASSWORD, PAYLOAD_SECRET, PURGE_TOKEN), make -C infra up."
	@echo "Мультисайт на одном сервере — см. docs/roadmap.md, Фаза 3."
