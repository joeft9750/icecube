# IceCube Express - Site Multi-Pages

Site vitrine professionnel multi-pages pour entreprise de vente de glaçons.
Design moderne "premium froid" avec palette de couleurs glacée.

## 📁 Structure du site

### Pages HTML (7 pages)
1. **index.html** - Page d'accueil avec hero et tuiles de navigation
2. **produits.html** - Catalogue détaillé des 4 types de glaçons
3. **livraison-tarifs.html** - Zones, tarifs et processus de livraison
4. **devis.html** - Formulaire complet de demande de devis
5. **cgv.html** - Conditions générales de vente
6. **faq.html** - Questions fréquentes avec accordéon interactif
7. **contact.html** - Formulaire de contact et coordonnées

### Fichiers de style et scripts
- **styles.css** - Tous les styles du site (26 KB)
- **script.js** - Animations et interactions (14 KB)

## 🎨 Palette de couleurs

Le site utilise une palette de 5 couleurs froides cohérente :

- **#162735** - Couleur principale (fond sombre, header, footer)
- **#406E86** - Couleur secondaire (sections, boutons)
- **#94B3CA** - Couleur d'accent (hover, boutons principaux)
- **#9ABBCB** - Fond clair (sections alternées)
- **#BDC1C8** - Fonds très clairs, bordures

## 🔤 Typographie

- **Outfit** - Font display pour titres et éléments importants
- **Manrope** - Font body pour texte courant

Chargées via Google Fonts CDN (aucun fichier local requis).

## 🚀 Installation

1. Télécharger tous les fichiers HTML, CSS et JS
2. Les placer dans le même dossier
3. Ouvrir `index.html` dans un navigateur

**Aucune dépendance externe** - Le site fonctionne immédiatement !

## ✨ Fonctionnalités

### Navigation
✅ Header fixe (sticky) avec changement au scroll
✅ Menu responsive avec version mobile hamburger
✅ Navigation multi-pages fluide
✅ Breadcrumb sur chaque page
✅ Lien actif automatique selon la page

### Design
✅ Design "premium froid" distinctif
✅ Animations au scroll (Intersection Observer)
✅ Effet parallax sur le hero
✅ Transitions fluides sur tous les éléments
✅ Footer style "Instant Gaming" avec newsletter

### Formulaires
✅ Formulaire de devis complet avec validation
✅ Formulaire de contact avec validation
✅ Validation en temps réel des champs
✅ Messages de succès animés
✅ Date minimum automatique (lendemain)

### Interactions
✅ FAQ avec accordéon interactif
✅ Tuiles cliquables sur l'accueil
✅ Effets hover sur cartes et boutons
✅ Menu mobile avec animation
✅ Smooth scroll vers sections

### Responsive
✅ Mobile (< 768px)
✅ Tablette (768px - 1024px)
✅ Desktop (> 1024px)
✅ Layout adaptatif avec Grid et Flexbox

## 📱 Points de rupture responsive

```css
Desktop    : > 1024px  - Layout complet 3 colonnes
Tablette   : 768-1024px - Layout adapté 2 colonnes
Mobile     : < 768px   - Layout empilé 1 colonne + menu hamburger
```

## 🎯 Pages détaillées

### index.html
- Hero plein écran avec dégradé
- 6 tuiles cliquables vers les autres pages
- Section "Pourquoi nous choisir" avec 4 arguments
- Footer complet avec newsletter

### produits.html
- 4 produits détaillés avec visuel
- Badges de catégorie
- Spécifications techniques
- Boutons de commande
- CTA final vers devis

### livraison-tarifs.html
- 3 blocs d'informations (zones, minimum, délais)
- Tableau de tarifs par zone
- Processus en 3 étapes
- Services complémentaires
- CTA vers devis

### devis.html
- Formulaire multi-sections
- Validation JavaScript
- Checkboxes produits
- Message de succès
- Tous champs requis marqués

### cgv.html
- 11 articles juridiques
- Notice d'avertissement
- Texte générique à valider
- Mise en page claire
- Dernière mise à jour indiquée

### faq.html
- 4 catégories de questions
- Système d'accordéon
- 10 questions au total
- CTA vers contact
- Réponses détaillées

### contact.html
- Layout 2 colonnes
- Coordonnées complètes
- Formulaire simple
- Horaires d'ouverture
- Zones de livraison

## 🔧 Personnalisation

### Modifier les couleurs
Éditer les variables CSS dans `styles.css` (lignes 10-15) :
```css
:root {
    --primary: #162735;
    --secondary: #406E86;
    --accent: #94B3CA;
    --light: #9ABBCB;
    --lighter: #BDC1C8;
}
```

### Modifier le nom de l'entreprise
Rechercher "IceCube Express" dans tous les fichiers HTML et remplacer.

### Ajouter des produits
Dupliquer un bloc `.product-detailed` dans `produits.html`.

### Modifier les zones de livraison
Éditer le tableau dans `livraison-tarifs.html`.

### Personnaliser la FAQ
Ajouter/modifier des `.faq-item` dans `faq.html`.

## 📝 Améliorations possibles

### Backend (à implémenter)
- Connexion formulaires à un service email (EmailJS, Formspree)
- Base de données pour stocker les demandes
- Système de paiement en ligne
- Espace client

### SEO
- Balises meta Open Graph
- Sitemap.xml
- Données structurées Schema.org
- Optimisation images

### Performance
- Minification CSS/JS
- Lazy loading images
- Compression fichiers
- CDN pour assets

## ⚖️ Avertissement juridique

Les CGV fournies sont **génériques et à titre indicatif**.
Elles **doivent être validées par un professionnel du droit** avant utilisation commerciale.

## 🌐 Compatibilité navigateurs

Le site utilise des technologies standard compatibles avec :
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📊 Statistiques du projet

- **7 pages HTML** (109 KB total)
- **1 fichier CSS** (26 KB)
- **1 fichier JavaScript** (14 KB)
- **~2000 lignes de code**
- **0 dépendance externe** (sauf Google Fonts)

## 🎨 Choix de design

- **Esthétique** : Premium froid, moderne, clean
- **Ambiance** : Professionnelle, rassurante, efficace
- **Inspiration** : Style "Instant Gaming" pour le footer
- **Typographie** : Distinctive sans être générique
- **Couleurs** : Palette froide cohérente

## 💡 Conseils d'utilisation

1. **Tester localement** : Ouvrir index.html dans Chrome
2. **Vérifier responsive** : Utiliser les DevTools (F12)
3. **Tester formulaires** : Vérifier validation et messages
4. **Personnaliser contenu** : Adapter textes et images
5. **Valider CGV** : Consulter un avocat

## 🐛 Débogage

Si le site ne fonctionne pas :
1. Vérifier que tous les fichiers sont dans le même dossier
2. Vérifier la console (F12) pour erreurs JavaScript
3. Vérifier que les chemins des fichiers sont corrects
4. Tester dans un autre navigateur

## 📞 Support

Le site est fourni "tel quel" à titre d'exemple.
Adaptez-le librement à vos besoins.

---

**Développé avec ❄️ par Claude**  
Site vitrine professionnel multi-pages  
HTML5 • CSS3 • JavaScript Vanilla  
Décembre 2025
