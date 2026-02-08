# Coolify Deployment Guide - Getmait Platform

Deploy Getmait Platform til din egen Hetzner server med Coolify.

## 🚀 Fordele ved Coolify vs Vercel

✅ **Din egen infrastruktur** - Fuld kontrol
✅ **Ingen external dependencies** - Alt på din server
✅ **Billigere** - Ingen monthly fees til hosting platform
✅ **Wildcard subdomain support** - Built-in multi-tenant
✅ **Custom SSL certificates** - Let's Encrypt integration

---

## 📋 Forudsætninger

- ✅ Hetzner server med Coolify installeret
- ✅ Domain pegende til din server
- ✅ Supabase database opsat

---

## 🎯 Deploy via Coolify Dashboard

### Step 1: Opret Nyt Project i Coolify

1. Log ind på din Coolify dashboard
2. Klik **"+ New"** → **"Resource"**
3. Vælg **"Public Repository"**

### Step 2: Konfigurer Repository

**Repository URL:**
```
https://github.com/simongrevang/getmait-platform
```

**Branch:** `main`

**Build Pack:** `Dockerfile`

### Step 3: Environment Variables

Tilføj følgende environment variables i Coolify:

```bash
VITE_SUPABASE_URL=http://46.224.239.43:8000
VITE_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3MDI4NjgwMCwiZXhwIjo0OTI1OTYwNDAwLCJyb2xlIjoiYW5vbiJ9.Lshy9-QNUcZhFol6_zI6yinhWak7nmkd03rMs94-viE
```

⚠️ **Vigtigt:** Disse environment variables skal være **build-time** variables, ikke runtime!

### Step 4: Port Configuration

- **Port:** `80` (nginx serves på port 80 i container)
- **Public Port:** `80` eller `443` (med SSL)

### Step 5: Domain Setup

#### Single Domain (Test)
```
getmait.din-domain.dk
```

#### Wildcard Domain (Multi-tenant - Anbefalet)
```
*.getmait.dk
getmait.dk
```

Dette tillader:
- `napoli-esbjerg.getmait.dk`
- `bella-aarhus.getmait.dk`
- osv.

### Step 6: Deploy

Klik **"Deploy"** og vent på build processen.

---

## 🔧 Advanced Configuration

### Custom Dockerfile Build Args

Hvis du vil passe build arguments:

```dockerfile
# I Coolify Build Args sektion:
NODE_ENV=production
```

### Health Check

Coolify kan automatisk health-checke din app:

**Health Check Path:** `/`
**Expected Status:** `200`

---

## 🌐 DNS Konfiguration (Wildcard)

For multi-tenant support skal du sætte wildcard DNS op:

### Cloudflare Example

```
Type: A
Name: @
Value: <din-hetzner-server-ip>
Proxy: ✅ Enabled

Type: A
Name: *
Value: <din-hetzner-server-ip>
Proxy: ✅ Enabled
```

### Direkte DNS (Uden Cloudflare)

```
Type: A
Name: @
Value: <din-hetzner-server-ip>
TTL: 3600

Type: A
Name: *
Value: <din-hetzner-server-ip>
TTL: 3600
```

---

## 🔐 SSL/HTTPS Setup

Coolify håndterer automatisk Let's Encrypt SSL certificates:

1. I Coolify dashboard → gå til dit project
2. Under **"Domains"** → klik **"Generate SSL"**
3. Vent ~2 minutter på certificate generation
4. ✅ Din app er nu på HTTPS!

For wildcard SSL:
- Kræver DNS validation (Coolify guider dig)
- Fungerer automatisk for alle subdomains

---

## 📊 Database Connection

### Lokal Supabase (Valgfrit)

Hvis du vil hoste Supabase selv på samme server:

```bash
# I Coolify, tilføj Supabase som service
# Opdater environment variables:
VITE_SUPABASE_URL=http://supabase:8000
VITE_SUPABASE_ANON_KEY=<din-key>
```

### External Supabase (Current)

Din nuværende setup med `46.224.239.43:8000` fungerer fint!

---

## 🔄 Continuous Deployment

### Automatisk Deploy ved Git Push

Coolify kan automatisk deploye når du pusher til GitHub:

1. I Coolify → dit project → **"Settings"**
2. Under **"Automatic Deployment"**
3. Aktivér **"Deploy on push"**
4. Coolify genererer en webhook URL
5. Tilføj webhook i GitHub:
   - Gå til `github.com/simongrevang/getmait-platform/settings/hooks`
   - Add webhook → indsæt Coolify webhook URL
   - Content type: `application/json`
   - Events: `Just the push event`

Nu deployer din app automatisk ved hver `git push`! 🚀

---

## 🐳 Manuel Docker Deploy (Alternative)

Hvis du vil deploye uden Coolify dashboard:

### Build Image

```bash
cd /root/getmait-platform

docker build \
  --build-arg VITE_SUPABASE_URL=http://46.224.239.43:8000 \
  --build-arg VITE_SUPABASE_ANON_KEY=eyJ... \
  -t getmait-platform:latest \
  .
```

### Run Container

```bash
docker run -d \
  --name getmait-platform \
  -p 80:80 \
  --restart unless-stopped \
  getmait-platform:latest
```

### With Docker Compose

```yaml
version: '3.8'

services:
  getmait-platform:
    build:
      context: .
      args:
        VITE_SUPABASE_URL: http://46.224.239.43:8000
        VITE_SUPABASE_ANON_KEY: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
    ports:
      - "80:80"
    restart: unless-stopped
```

---

## ✅ Deployment Checklist

- [ ] GitHub repository pushed
- [ ] Coolify project oprettet
- [ ] Environment variables konfigureret
- [ ] Domain DNS sat op (A record + wildcard)
- [ ] SSL certificate genereret
- [ ] Supabase database har data
- [ ] Test deployment på subdomain (fx napoli-esbjerg.getmait.dk)
- [ ] Webhook sat op for auto-deploy (valgfrit)

---

## 🔍 Troubleshooting

### Build Fejler

**Problem:** `npm ci` fejler
**Løsning:**
```bash
# Test lokalt først:
docker build -t test .
```

### Environment Variables Ikke Loaded

**Problem:** Supabase connection fejler
**Løsning:**
- Verificer at env vars er sat som **build-time** (ikke runtime)
- Rebuild container efter env var changes

### Wildcard Domain Virker Ikke

**Problem:** Subdomains loader ikke
**Løsning:**
- Check DNS propagation: `dig napoli-esbjerg.getmait.dk`
- Verificer wildcard A record: `*.getmait.dk`
- Vent op til 24 timer på DNS propagation

### Port 80 Already in Use

**Problem:** Port conflict
**Løsning:**
```bash
# Find hvilket program bruger port 80:
sudo lsof -i :80

# Stop det eller brug anden port:
docker run -p 8080:80 ...
```

---

## 📈 Monitoring

Coolify tilbyder built-in monitoring:

- **Logs:** Real-time container logs
- **Metrics:** CPU, RAM, Disk usage
- **Uptime:** Health check status
- **SSL:** Certificate expiry warnings

---

## 🎯 Production Best Practices

1. **Use Specific Node Version**
   ```dockerfile
   FROM node:18.19.0-alpine
   ```

2. **Multi-stage Build** (allerede implementeret ✅)
   - Mindre image size
   - Hurtigere deploys

3. **Health Checks**
   ```dockerfile
   HEALTHCHECK --interval=30s --timeout=3s \
     CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1
   ```

4. **Resource Limits** (i Coolify)
   - Memory: 512MB-1GB
   - CPU: 0.5-1 core

---

## 🚀 Ready to Deploy?

Gå til din Coolify dashboard og følg Step 1-6 ovenfor!

Din app vil være live på: `https://getmait.dk` (eller dit domæne) 🎉

---

## 📞 Support

Spørgsmål om Coolify deployment? Lad mig vide det!
