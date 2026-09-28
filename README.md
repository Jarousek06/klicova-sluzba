# Klíčová služba Martin Reich — web

Statický web (bez buildu): `index.html`, `assets/css/style.css`, `assets/js/main.js`.
Náhled: konfigurace `klicova-sluzba` v `.claude/launch.json` → http://localhost:5187

## Design
- Hlavička ve tvaru klíče: hlava (monogram MR) + mosazná čepel se zářezy (`clip-path`),
  drážka čepele slouží jako ukazatel posunu stránky.
- Úvod: animovaný řez stavítkovou vložkou (SVG generované v `main.js`) — klíč zajede,
  stavítka se srovnají na střižné linii, vložka se otočí. Při `prefers-reduced-motion` stojí.
- Přechody sekcí mají zubatý okraj jako profil klíče (`--cut` v CSS).
- Sekce Generální klíč je interaktivní ukázka (data v `ACCESS` v `main.js`).

## Otevírací doba
Je na dvou místech: tabulka v `index.html` a pole `HOURS` v `main.js`
(počítá živý stav Otevřeno / Polední pauza / Zavřeno). Při změně upravit obojí.

## Čeká na klienta
- [ ] Fotky provozovny, výlohy, frézky — web je zatím čistě grafický
- [ ] Potvrdit: dělá čipové / transpondérové autoklíče? (web píše jen „autoklíče“)
- [ ] Potvrdit: běžné klíče na počkání? (web to záměrně neslibuje)
- [ ] Ceník nebo aspoň orientační ceny
- [ ] Rok založení / jak dlouho firma funguje
- [ ] Doména — po nasazení doplnit absolutní `og:url` a `og:image`
- [ ] Souhlas s uvedením recenzí (jména zkrácena na iniciály příjmení)
