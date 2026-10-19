# Código — Portuguese driving theory practice

Practice app for the Portuguese driving licence theory exam (*exame de código*),
with Portuguese side by side with **English** or **Ukrainian**.

**Live:** https://antonpaisov.github.io/codigo-pt/

- All ~4,900 questions from the [official IMT question database](https://www.imt-ip.pt/condutores/obtencao/perguntas-de-exame/), filterable by licence category (A, AM, B, C, D)
- Practice by topic, a "my mistakes" deck, and a timed exam simulation (size / mistakes allowed / time are configurable)
- Progress is stored locally in your browser; installable on your phone (Add to Home Screen)

> ⚠️ IMT does not publish the correct answers. Answers, category tags, translations
> and explanations were generated with Claude and may contain mistakes.
> Use the "Report a wrong answer" link under a question to open an issue.

## Development

```sh
npm install
npm run dev
```

## Data pipeline

```sh
sh pipeline/download.sh                       # official PDFs -> data/raw/
pip install pymupdf
python pipeline/extract.py data/raw public/img data/questions_pt.json
# data/chunks/*.json are processed by Claude agents following pipeline/AGENT_INSTRUCTIONS.md
python3 pipeline/validate.py --all
python3 pipeline/merge.py                     # -> public/data/questions.json
```
