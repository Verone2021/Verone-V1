# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e6]:
    - heading "Ce site est inaccessible" [level=1] [ref=e7]:
      - generic [ref=e8]: Ce site est inaccessible
    - paragraph [ref=e9]:
      - strong [ref=e10]: localhost
      - text: n'autorise pas la connexion.
    - generic [ref=e11]:
      - paragraph [ref=e12]: "Voici quelques conseils :"
      - list [ref=e13]:
        - listitem [ref=e14]: Vérifier la connexion
        - listitem [ref=e15]:
          - link "Vérifier le proxy et le pare-feu" [ref=e16] [cursor=pointer]:
            - /url: "#buttons"
    - generic [ref=e17]: ERR_CONNECTION_REFUSED
  - generic [ref=e18]:
    - button "Actualiser" [ref=e20] [cursor=pointer]
    - button "Détails" [ref=e21] [cursor=pointer]
```