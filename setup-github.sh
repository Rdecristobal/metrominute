#!/bin/bash
# Setup GitHub + Vercel para MetroMinute
# Ejecutar desde: /home/claw1/.openclaw/workspace-dyzink/metrominute

set -e

echo "🚀 Configurando MetroMinute para GitHub + Vercel..."

# 1. Crear repo en GitHub
echo ""
echo "📍 PASO 1: Crear repositorio en GitHub"
echo "   1. Abre: https://github.com/new"
echo "   2. Nombre: metrominute"
echo "   3. Descripción: MetroMinute - Arcade games for quick sessions"
echo "   4. Público"
echo "   5. NO inicializar README"
echo "   6. Click 'Create repository'"
echo ""
read -p "   ¿Repo creado? (y/n): " confirm

if [ "$confirm" != "y" ]; then
    echo "❌ Cancelado"
    exit 1
fi

# 2. Añadir remote y push
echo ""
echo "📍 PASO 2: Conectando con GitHub..."
git remote add origin https://github.com/Rdecristobal/metrominute.git
git push -u origin main
echo "✅ Push completado"

# 3. Instrucciones Vercel
echo ""
echo "📍 PASO 3: Conectar con Vercel"
echo "   1. Abre: https://vercel.com/new"
echo "   2. Importa: Rdecristobal/metrominute"
echo "   3. Framework: Next.js (auto-detectado)"
echo "   4. Variables de entorno (copiar de dyzink-website):"
echo "      - NEXT_PUBLIC_SUPABASE_URL"
echo "      - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "      - SUPABASE_SERVICE_ROLE_KEY"
echo "   5. Click 'Deploy'"
echo ""
echo "✅ Setup completado!"
echo "🌐 URL: https://metrominute.dyzink.com (después de configurar dominio)"
