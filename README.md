# Air Defense Tower Defense

Et HTML/CSS/JavaScript tower defense-spill laget for GitHub Pages.

## Filstruktur

```text
air-defense-tower-defense/
├── index.html
├── style.css
├── script.js
├── config.js
└── assets/
    ├── towers/
    ├── enemies/
    └── maps/
```

## Hvordan endre ikoner

Legg egne SVG/PNG/WebP-filer i:

```text
assets/towers/
assets/enemies/
assets/maps/
```

Deretter endrer du filstien i `config.js`.

Eksempel:

```js
icon: "assets/towers/min-f35.svg"
```

## Hvordan publisere på GitHub Pages

1. Last opp alle filene til repositoryet.
2. Gå til `Settings`.
3. Gå til `Pages`.
4. Velg `Deploy from branch`.
5. Velg `main` og `/root`.
6. Lagre.

Spillet åpnes fra:

```text
https://brukernavn.github.io/repository-navn/
```
