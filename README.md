
// --------------------------------------------------
// -- Script Commands
// --------------------------------------------------

// 🚀 Start/Refresh Environment (Tailwind watcher included in local/dev)
./deploy.sh [local|dev|uat|prod]

// ⏹️ Stop Environment
./stop.sh [local|dev|uat|prod]

// 📦 Backup Database
./backup.sh [local|dev|uat|prod]

// --------------------------------------------------
// -- Top Level Docs
// --------------------------------------------------

[Front to Back End Logic Flow Map](https://app.diagrams.net/#G1b0t8kKfrssmcFfAuWNSa9hggPBg9oHBx#%7B%22pageId%22%3A%22lgzr07OJg0d5W419G7qd%22%7D)

// --------------------------------------------------
// -- Pricing Tiers
// --------------------------------------------------

- The initial pricing tiers required for application start up can be found here:
/backend/initial_pricing_tier_list.sql

// --------------------------------------------------
// -- Changing Prisma Postgres Schema
// --------------------------------------------------

1. Adapt the prisma schema file
2. Ensure the docker containers are running
3. docker compose exec backend sh
    a. When running a specific docker compose script... docker compose -f docker-compose.dev.yml exec backend sh
4. npx prisma migrate dev --name add_profile_settings // this can be any name, its just a tag for the migration
5. Check the local migrations directory
6. docker compose restart backend

// History of changes saved in Prisma migratitons folder.

// --------------------------------------------------
// -- Initializing New Server
// --------------------------------------------------

// Create admin role
1. Sign up as a new user on the site.
2. psql -h localhost -p 5432 -U mm_admin -d mm_primary
    or in prod: docker compose -f docker-compose.prod.yml exec postgres psql -U mm_admin_prod -d mm_primary_prod
3. In the "User" table:
    - Change status to 'ACTIVE'
    - Change role to 'admin'
    - *CASE SENSITIVE*

// --------------------------------------------------
// -- Pushing Significant Changes?
// --------------------------------------------------

1. Ensure browser cache is cleared or use guest account.
2. This may only be an issue on the small linode instatnce, but to ensure the previously generated front end files are removed and recreated, run:
    docker volume rm momentum_manager_frontend_dist
3. Restart the containers with build --no-cache

// --------------------------------------------------
// -- OpenAPI Backend View
// --------------------------------------------------

Access via url: https://momentum.local/api/docs/


// --------------------------------------------------
// -- AWS Deployment Setup
// --------------------------------------------------

ssh-keygen -t ed25519 -C "server_deploy_key"
Generating public/private ed25519 key pair.
Enter file in which to save the key (/home/ubuntu/.ssh/id_ed25519): 
Enter passphrase (empty for no passphrase): 
Enter same passphrase again: 
Your identification has been saved in /home/ubuntu/.ssh/id_ed25519
Your public key has been saved in /home/ubuntu/.ssh/id_ed25519.pub
The key fingerprint is:
SHA256:H8RptfwpizJF55Q1lMjYlw8wDqRsI3XK479CH3iuQAQ server_deploy_key
The key's randomart image is:
+--[ED25519 256]--+
|    E   ..+++++o |
|     . + =.*+==. |
|      o O * B. o |
|     . + * + . ..|
|      . S.o o o  |
|     .  o+oo o   |
|      ..o++..    |
|       ..oo.     |
|        .o.      |
+----[SHA256]-----+

cat ~/.ssh/id_ed25519.pub
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIIblgJx442rTM/mQfmgsn9gGHVVzsA7pKY61948DZ1ix server_deploy_key

ubuntu@ip-172-26-15-145:~$ ssh -T git@github.com
The authenticity of host 'github.com (20.26.156.215)' can't be established.
ED25519 key fingerprint is SHA256:+DiY3wvvV6TuJJhbpZisF/zLDA0zPMSvHdkr4UvCOqU.
This key is not known by any other names
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'github.com' (ED25519) to the list of known hosts.
Hi arthur-agb/momentum_manager! You've successfully authenticated, but GitHub does not provide shell access.

ubuntu@ip-172-26-15-145:~$ sudo rm -rf /home/ubuntu/app

// --------------------------------------------------
// -- Database Access (via psql)
// --------------------------------------------------

// Local
psql -h localhost -p 5434 -U mm_admin_local -d mm_primary_local

// Cloud (UAT/Prod)
docker compose -f docker-compose.prod.yml exec postgres psql -U mm_admin_prod -d mm_primary_prod
