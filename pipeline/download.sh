#!/bin/sh
# Download the official IMT question PDFs into data/raw/
set -e
mkdir -p data/raw
for i in $(seq 1 14); do
  curl -sfL -A "Mozilla/5.0" -o "data/raw/rel_$i.pdf" \
    "https://www.imt-ip.pt/wp-content/uploads/IMTT/Portugues/Condutores/PerguntasExames/Documents/rel_${i}_condutores.pdf"
done
