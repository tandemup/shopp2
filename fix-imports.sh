#!/bin/bash

echo "🔧 Normalizando imports..."

# Carpeta raíz (ajusta si no estás en root del proyecto)
ROOT_DIR="./src"

# Buscar archivos TS/TSX
FILES=$(find $ROOT_DIR -type f \( -name "*.ts" -o -name "*.tsx" \))

for FILE in $FILES; do
  echo "Procesando $FILE"

  # Reemplazar @/src/... → relativo ../../...
  sed -i '' -E '
  s|@/src/([^";]+)|__REPLACE__\1|g
  ' "$FILE"

  # Reemplazar @/... → relativo
  sed -i '' -E '
  s|@/([^";]+)|__REPLACE__\1|g
  ' "$FILE"

done

echo "⚙️ Ajustando rutas relativas..."

# Segunda pasada: convertir __REPLACE__ a rutas relativas reales
for FILE in $FILES; do
  DIR=$(dirname "$FILE")

  sed -i '' -E "
  s|__REPLACE__([^\";]+)|$(realpath --relative-to="$DIR" "./src/\1" 2>/dev/null || echo \1)|g
  " "$FILE"

done

echo "✅ Imports normalizados"