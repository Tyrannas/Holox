### I. Langage naturel // pas forcément nécessaire parceque cette représentation force aussi à penser un peu différemment donc pas sûr que cette première étape soit pertinente

La solution que tu cherches est le système d'écriture qu'utilisaient les anciens égyptiens et qui a été decrypté par Champolion. 

### II. Preprocessing ( Finalement il va falloir commencer depuis là I. vers II. impossible)

```
Toi -> (Chercher + Assidument):3 -> Solution:1,
Moi -> @3 -> @1,
@1 -> Etre -> (Système + Ecriture):2,
(*Egyptiens* + **Anciens**) \> Utiliser \> @2,
Champolion \> Decrypter \> @2.
```

// Rajouter n'importe quel type de noeud pour faciliter compréhension ! Genre noeud personne ?

### III. Tokenization (Lexing)

mot present_droit left_par mot link_mot mot right_par present_droit mot id fin_expression ref ...

### IV. Transformation en arbre syntaxique (Parsing)

Les tokens sont consommés par le parser qui utilise la grammaire pour transformer en arbre total puis en AST.
L'AST ne contient que les informations utiles à l'évaluation. 

Ce qu'on veut garder: 
 - La noeud top, le texte sinon arbre sans tête
 - la notion de phrase: tous les ids et les refs sont gardés dans le scope d'une phrase
 - La notion de groupe de mots => c'est à dire ce qui pourra être connecté par un verbe
 - La notion de mot, le noeud mot d'un groupe
 - La notion d'id et de ref, pour qu'ils soient évalués plus tard
 - La notion de verbe, qui relie deux groupes, avec une direction et un temps pour l'action

Pour récupérer tout 

### V. Transformation en dictionnaire de valeurs 

A partir de l'AST il faut => donner un id unique à chaque groupe et chaque noeud de groupe, 
évaluer les id (ceux déclarés dans le code avec :id) et les refs pour créer un truc dans le genre: 

```yaml
Phrase:
  Groups:
    - id: G0
      words:
        - G0W0
          value: "Toi"
    - id: G1
      words:
        - G1W1
          value: "Moi"
    - id: G2
      words:
        - id: G2W1
          value: "Solution"
    - id: G3
      words:
        - id: G3W1
          value: "Systeme" // question, qu'est ce qui prédomine entre système et écriture ? Peut être que les deux devraient partager un cercle unique de "groupe sujet" sans qualificatif
        - id: G3W2
          value: "Ecriture"
    - id: G4
      words:
        - id: G4W1
          value: "Egyptien"
          plural: true // créé par une deco
        - id: G4W2
          value: "ancien"
          ref: G4W1
          strong: true //créé par une deco 
    - id: G5
      words:
        - id: G5W1
          value: "Champolion"

  Verbs:
    - id: V0
      value: "Chercher"
      actions: 
        - time: present
          from: G1
          to: G2
        - time: present
          from: G0
          to: G2
    - id: V1
      value: "Etre"
      from: G2
      to: G3
      time: present
    - id: V2
      value: "Utiliser"
      from: G4
      to: G3
      time: past
    - id: V3
      value: "Decrypter"
      from: G5
      to: G3
      time: past

```
### V. Représentation visuelle: not yet  

