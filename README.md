# Constructieve Quickscan - CCS Engineering

Een moderne web applicatie voor het verzamelen van project informatie voor constructieve beoordelingen. Deze tool begeleidt gebruikers stap voor stap door een gestructureerd proces voor het uploaden van documenten en het beantwoorden van technische vragen.

## Features

- **Stap-voor-stap flow**: Intuïtieve gebruikersinterface die gebruikers begeleidt door het quickscan proces
- **BAG API integratie**: Automatische opzoek van bouwjaar uit de Basisregistratie Adressen en Gebouwen
- **File upload**: Drag & drop interface voor documenten en foto's
- **Thumbnail previews**: Automatische miniaturen voor geüploade foto's
- **Voorwaardelijke navigatie**: Dynamische routing gebaseerd op antwoorden
- **File upload configuratie**: Toegestane formaten en grootte limieten
- **Terminatie condities**: Exit points voor verschillende scenario's

## Environment Variables

De applicatie gebruikt environment variables voor API configuratie. Maak een `.env` bestand aan in de root van het project:

```bash
# BAG API Configuration
VITE_BAG_API_KEY=your_bag_api_key_here
VITE_BAG_API_BASE_URL=https://api.bag.kadaster.nl/lvbag/individuelebevragingen/v2
```

### BAG API Key verkrijgen

1. Ga naar [BAG API Portal](https://lvbag.github.io/BAG-API/)
2. Registreer voor een API key
3. Voeg de key toe aan je `.env` bestand

**Let op**: De `.env` file wordt niet in Git opgeslagen voor veiligheid.

## Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structuur

```
src/
├── components/
│   ├── FormStep.tsx      # Formulier stap component met BAG integratie
│   ├── QuickScan.tsx     # Hoofd component die de flow beheert
│   └── StartScreen.tsx   # Welkomstscherm
├── utils/
│   ├── bagApi.ts         # BAG API integratie service
│   └── flowEngine.ts     # Flow logica en validatie
├── types/
│   └── flow.ts          # TypeScript definities
└── App.tsx              # Root component
```

## BAG API Integratie

De applicatie integreert automatisch met de BAG API om:

- **Bouwjaar op te halen** op basis van ingevoerd adres
- **Adres validatie** te doen
- **Officiële BAG data** te gebruiken voor accurate beoordelingen

### Adres Formaat

Het verwachte adres formaat is:
```
"Straatnaam 123, 1234 AB Plaatsnaam"
```

Voorbeeld: `"Hoofdstraat 123, 1234 AB Amsterdam"`

## Deployment

Zie `AWS_DEPLOYMENT.md` voor uitgebreide deployment instructies.

### Environment Variables in Productie

Voor AWS Amplify deployment, voeg environment variables toe in de Amplify console:

1. Ga naar je app in AWS Amplify
2. Settings → Environment variables
3. Voeg toe:
   - `VITE_BAG_API_KEY` = je BAG API key
   - `VITE_BAG_API_BASE_URL` = https://api.bag.kadaster.nl/lvbag/individuelebevragingen/v2

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
- Thumbnail previews voor afbeeldingen

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
