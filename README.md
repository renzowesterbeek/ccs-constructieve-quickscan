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
- **S3 Cloud Storage**: Automatische upload van packages naar AWS S3
- **Email Notificaties**: Automatische email notificaties met download links
- **Secure Downloads**: Tijdsgebonden download links (7 dagen geldig)

## Environment Variables

De applicatie gebruikt environment variables voor API configuratie. Maak een `.env` bestand aan in de root van het project:

```bash
# BAG API Configuration
VITE_BAG_API_KEY=your_bag_api_key_here
VITE_BAG_API_BASE_URL=https://api.bag.kadaster.nl/lvbag/individuelebevragingen/v2

# Backend API Configuration (voor S3 upload en email)
VITE_API_BASE_URL=https://your-api-gateway-url.amazonaws.com/dev
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

## Backend Setup (S3 & Email)

Voor S3 upload en email notificaties, moet de backend service worden gedeployed:

```bash
# Ga naar backend directory
cd backend

# Installeer dependencies
npm install

# Deploy naar AWS (vereist AWS CLI configuratie)
./deploy.sh dev

# Of handmatig deployen
npm run deploy:dev
```

Zie `backend/README.md` voor uitgebreide instructies.

## Project Structuur

```
src/
├── components/
│   ├── FormStep.tsx      # Formulier stap component met BAG integratie
│   ├── QuickScan.tsx     # Hoofd component die de flow beheert
│   └── StartScreen.tsx   # Welkomstscherm
├── utils/
│   ├── bagApi.ts         # BAG API integratie service
│   ├── flowEngine.ts     # Flow logica en validatie
│   └── packageService.ts # S3 upload en email service
├── types/
│   └── flow.ts          # TypeScript definities
└── App.tsx              # Root component

backend/
├── src/
│   └── index.ts         # Lambda function voor S3 upload en email
├── serverless.yml       # AWS infrastructure configuratie
├── package.json         # Backend dependencies
└── README.md           # Backend deployment instructies
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

## S3 & Email Integratie

De applicatie ondersteunt automatische upload naar AWS S3 en email notificaties:

- **S3 Upload**: Packages worden automatisch geüpload naar een beveiligde S3 bucket
- **Email Notificaties**: Automatische notificaties naar renzo@creativecitysolutions.com
- **Download Links**: Veilige, tijdsgebonden download links (7 dagen geldig)
- **Auto-cleanup**: Oude packages worden automatisch verwijderd na 30 dagen
- **Fallback**: Lokaal downloaden als backend niet beschikbaar is

## Deployment

Zie `AWS_DEPLOYMENT.md` voor uitgebreide deployment instructies.

### Environment Variables in Productie

Voor AWS Amplify deployment, voeg environment variables toe in de Amplify console:

1. Ga naar je app in AWS Amplify
2. Settings → Environment variables
3. Voeg toe:
   - `VITE_BAG_API_KEY` = je BAG API key
   - `VITE_BAG_API_BASE_URL` = https://api.bag.kadaster.nl/lvbag/individuelebevragingen/v2
   - `VITE_API_BASE_URL` = je API Gateway URL

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
3. **S3 Package**: Automatische upload naar AWS S3
4. **Email Notificatie**: Professionele email met download link
5. **Lokale Download**: Backup download voor directe toegang

Perfect voor verdere verwerking door engineers en constructieve adviseurs.

## Development

### Project uitbreiden

1. **Nieuwe step types toevoegen**: Voeg toe aan `FormStep.tsx` en update type definities
2. **Custom validatie**: Implementeer in `flowEngine.ts`
3. **Styling aanpassen**: Gebruik Tailwind classes in `src/index.css`
4. **Backend uitbreiden**: Modificeer `backend/src/index.ts` voor nieuwe functionaliteit

### Testing

```bash
npm run build    # Test productie build
npm run preview  # Preview productie build
```

## MVP Status

Deze applicatie is een volledig functionele productieversie met de volgende features:

- ✅ Cloud storage integratie (AWS S3)
- ✅ Database persistence (S3 metadata)
- ✅ Multi-user support (via S3)
- ✅ Advanced package generatie (ZIP files)
- ✅ Email notificaties (AWS SES)
- ✅ Admin dashboard (email notificaties)
- ✅ Secure file handling
- ✅ Auto-cleanup van oude bestanden

## Kosten

**Geschatte maandelijkse kosten:**
- **Frontend (Amplify)**: ~$1-5/maand
- **Backend (Lambda + S3 + SES)**: ~$1.80/maand
- **Totaal**: ~$3-7/maand

## License

© 2024 CCS Engineering. Alle rechten voorbehouden.
