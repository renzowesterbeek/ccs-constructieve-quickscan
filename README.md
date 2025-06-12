# Constructieve Quickscan - CCS Engineering

Een moderne web applicatie voor het verzamelen van project informatie voor constructieve beoordelingen. Deze tool begeleidt gebruikers stap voor stap door een gestructureerd proces voor het uploaden van documenten en het beantwoorden van technische vragen.

## Features

- **Stap-voor-stap flow**: Intuïtieve gebruikersinterface die gebruikers begeleidt door het quickscan proces
- **File uploads**: Drag & drop functionaliteit voor het uploaden van tekeningen, foto's en documenten
- **Voorwaardelijke navigatie**: Intelligente flow logica gebaseerd op antwoorden
- **Voortgangsindicator**: Real-time weergave van completievoortgang
- **Validatie**: Automatische validatie van vereiste velden en bestandsformaten
- **Package generatie**: Automatische creatie van een samenvattingsdocument met alle verzamelde informatie
- **Responsive design**: Werkt op desktop, tablet en mobiele apparaten

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Build tool**: Vite
- **YAML parsing**: js-yaml

## Project Structuur

```
src/
├── components/
│   ├── FormStep.tsx      # Herbruikbare form component voor verschillende input types
│   └── QuickScan.tsx     # Hoofd component die de flow beheert
├── types/
│   └── flow.ts           # TypeScript type definities
├── utils/
│   └── flowEngine.ts     # Core logica voor flow navigatie en validatie
└── App.tsx               # Root component
```

## Quickstart

1. **Installeer dependencies:**
   ```bash
   npm install
   ```

2. **Start de development server:**
   ```bash
   npm run dev
   ```

3. **Open de applicatie:**
   Navigeer naar `http://localhost:5173` in je browser

## Flow Configuratie

De quickscan flow wordt gedefinieerd in `public/quickscan_flow.yml`. Deze YAML file bevat:

- **Stap definities**: Elk met unieke ID, vraag, input type, en validatie regels
- **Voorwaardelijke navigatie**: Dynamische routing gebaseerd op antwoorden
- **File upload configuratie**: Toegestane formaten en grootte limieten
- **Terminatie condities**: Exit points voor verschillende scenario's

### Voorbeeld stap configuratie:

```yaml
- id: project_address
  question: "Wat is het projectadres?"
  type: string
  required: true
  next: project_bouwjaar

- id: upload_archief
  question: "Upload de archieftekeningen (.pdf/.dwg)"
  type: file
  allowed_extensions: [".pdf", ".dwg"]
  max_mb: 50
  required: true
  next: vraag_palenplan
```

## Ondersteunde Input Types

- **string**: Tekst invoer
- **int/float**: Numerieke invoer
- **choice**: Dropdown selectie
- **boolean**: Ja/Nee keuze
- **file**: Bestand upload met validatie

## File Upload Features

- Drag & drop interface
- Bestandstype validatie (extensies)
- Grootte validatie (MB limiet)
- Multiple file support
- Real-time upload feedback

## Output

Bij voltooiing genereert de applicatie:

1. **JSON summary**: Bevat alle ingevulde data en metadata
2. **Geüploade bestanden**: Alle documenten met gestructureerde naamgeving

Perfect voor verdere verwerking door engineers en constructieve adviseurs.

## Development

### Project uitbreiden

1. **Nieuwe step types toevoegen**: Voeg toe aan `FormStep.tsx` en update type definities
2. **Custom validatie**: Implementeer in `flowEngine.ts`
3. **Styling aanpassen**: Gebruik Tailwind classes in `src/index.css`

### Testing

```bash
npm run build    # Test productie build
npm run preview  # Preview productie build
```

## MVP Status

Deze applicatie is een MVP (Minimum Viable Product) voor lokaal gebruik. Features voor toekomstige versies:

- [ ] Cloud storage integratie
- [ ] Database persistence
- [ ] Multi-user support
- [ ] Advanced package generatie (ZIP files)
- [ ] Email notificaties
- [ ] Admin dashboard

## License

© 2024 CCS Engineering. Alle rechten voorbehouden.
