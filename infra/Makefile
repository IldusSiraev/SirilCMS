up:
	docker compose -f docker-compose.prod.yml up -d --build
ps:
	docker compose -f docker-compose.prod.yml ps
logs:
	docker compose -f docker-compose.prod.yml logs -f --tail=100
smoke:
	@docker compose -f docker-compose.prod.yml exec web wget -q -O- http://web:3000/api/health || true
backup:
	bash scripts/backup.sh
new-site:
	@echo "v1: новый сайт = отдельный деплой: cp ../.env ../.env.<name> (SITE_DOMAIN, POSTGRES_PASSWORD, PAYLOAD_SECRET) && docker compose -f docker-compose.prod.yml --project-name <name> up -d --build"
