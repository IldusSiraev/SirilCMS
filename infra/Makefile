up:
	docker compose -f docker-compose.prod.yml --env-file ../.env up -d --build
ps:
	docker compose -f docker-compose.prod.yml --env-file ../.env ps
logs:
	docker compose -f docker-compose.prod.yml --env-file ../.env logs -f --tail=100
smoke:
	@docker compose -f docker-compose.prod.yml --env-file ../.env exec web wget -q -O- http://web:3000/api/health || true
backup:
	bash scripts/backup.sh
new-site:
	@echo "v1: новый сайт = отдельный деплой: cp ../.env ../.env.<name> (SITE_DOMAIN, POSTGRES_PASSWORD, PAYLOAD_SECRET) && docker compose -f docker-compose.prod.yml --env-file ../.env.<name> --project-name <name> up -d --build"
