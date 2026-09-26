# Путь к env-файлу задаётся в одном месте — override: make -C infra up ENV_FILE=../.env.staging
ENV_FILE ?= ../.env

init:
	bash scripts/init-env.sh $(SITE_DOMAIN)

up:
	docker compose -f docker-compose.prod.yml --env-file $(ENV_FILE) up -d --pull always
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
	@echo "Новый сайт = новый сервер: клонировать репозиторий, make -C infra init SITE_DOMAIN=..., make -C infra up."
	@echo "Мультисайт на одном сервере — см. docs/roadmap.md, Фаза 3."
