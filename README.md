# Constructieve Quickscan - CCS

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

## BAG API Setup

De applicatie integreert automatisch met de BAG API om bouwjaren op te halen op basis van ingevoerde adressen.

### Stap 1: API Key Aanvragen

1. Ga naar het [Kadaster BAG API Portal](https://formulieren.kadaster.nl/aanvraag_bag_api_individuele_bevragingen_productie)
2. Vul het formulier in voor een API key voor de productieomgeving
3. Je ontvangt binnen enkele werkdagen een API key per email

### Stap 2: Environment Variables Configureren

1. Kopieer `env.example` naar `.env`:
   ```bash
   cp env.example .env
   ```

2. Voeg je API key toe aan het `.env` bestand:
   ```bash
   # BAG API Configuration
   VITE_BAG_API_KEY=your_actual_api_key_here
   VITE_BAG_API_BASE_URL=https://api.bag.kadaster.nl/lvbag/individuelebevragingen/v2
   ```

3. Herstart de development server:
   ```bash
   npm run dev
   ```

### Stap 3: API Testen

De applicatie bevat een ingebouwde BAG API test die toegankelijk is via een directe URL:

**BAG API Test URL**: `http://localhost:3000/bag-test-api`

1. Start de applicatie met `npm run dev`
2. Navigeer naar `http://localhost:3000/bag-test-api`
3. Voer een testadres in (bijv. "Dorpsstraat 15, 2631 CR Nootdorp")
4. Klik op "Test BAG API"
5. Controleer of de test succesvol is

**Alternatief**: De BAG API test is ook beschikbaar via de home page, maar is nu verplaatst naar een aparte pagina voor een schonere interface.

### Adres Formaat

Het verwachte adres formaat is:
```
"Straatnaam 123, 1234 AB Plaatsnaam"
```

Voorbeelden:
- `"Hoofdstraat 123, 1234 AB Amsterdam"`
- `"Dorpsstraat 15, 2631 CR Nootdorp"`
- `"Kerkstraat 42A, 5678 CD Rotterdam"`

### BAG API Functionaliteit

De BAG API integratie biedt:

- **Automatische bouwjaar lookup** op basis van adres
- **Adres validatie** en parsing
- **Fallback mechanismen** voor verschillende zoekmethoden
- **Uitgebreide logging** voor debugging
- **Error handling** en graceful degradation

### Troubleshooting BAG API

#### API Key Problemen
- **Symptoom**: "BAG API key not configured" error
- **Oplossing**: Controleer of `VITE_BAG_API_KEY` correct is ingesteld in `.env`

#### Adres Parsing Problemen
- **Symptoom**: "Invalid address format" error
- **Oplossing**: Gebruik het juiste adres formaat: "Straatnaam 123, 1234 AB Plaatsnaam"

#### API Rate Limiting
- **Symptoom**: 429 Too Many Requests error
- **Oplossing**: De BAG API heeft rate limits. Wacht enkele seconden en probeer opnieuw

#### Geen Bouwjaar Gevonden
- **Symptoom**: API werkt maar geen bouwjaar gevonden
- **Oplossing**: Dit kan normaal zijn voor sommige adressen. Controleer of het adres correct is

#### CORS Problemen
- **Symptoom**: CORS errors in browser console
- **Oplossing**: De BAG API ondersteunt CORS. Controleer je API key en URL

### BAG API Endpoints Gebruikt

De applicatie gebruikt de volgende BAG API endpoints:

- `/adressen` - Zoeken naar adressen op postcode/huisnummer
- `/panden/{id}` - Ophalen van bouwjaar uit pand informatie
- `/verblijfsobjecten/{id}` - Fallback voor bouwjaar informatie

## Environment Variables

De applicatie gebruikt environment variables voor API configuratie. Maak een `.env` bestand aan in de root van het project:

```bash
# BAG API Configuration
VITE_BAG_API_KEY=your_bag_api_key_here
VITE_BAG_API_BASE_URL=https://api.bag.kadaster.nl/lvbag/individuelebevragingen/v2

# Backend API Configuration (voor S3 upload en email)
VITE_API_BASE_URL=https://your-api-gateway-url.amazonaws.com/dev
```

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
│   ├── StartScreen.tsx   # Welkomstscherm met BAG API test
│   └── BAGApiTest.tsx    # BAG API test component
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

✅ **Core Features Complete**
- Stap-voor-stap flow
- BAG API integratie
- File upload functionaliteit
- S3 & Email integratie
- Mobile responsive design
- Error handling & validation

🔄 **In Development**
- Advanced BAG API features
- Additional file type support
- Enhanced error reporting

📋 **Planned**
- Multi-language support
- Advanced analytics
- Integration with external systems

## License

© 2024 CCS. Alle rechten voorbehouden.

## 📝 Next Steps

After deployment:
1. Test the application thoroughly
2. Set up monitoring (CloudWatch, AWS X-Ray)
3. Configure backups if needed
4. Set up CI/CD for automated deployments
5. Consider adding a backend API if needed

## 🆘 Troubleshooting

### Common Issues:
- **404 errors**: Ensure error document points to `index.html`
- **Asset loading**: Check that assets are publicly accessible
- **Routing issues**: Configure CloudFront for SPA routing

### Support:
- AWS Documentation
- AWS Support (if you have a support plan)
- Community forums
