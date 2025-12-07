# Guide d'utilisation Owl Carousel - IceCube Express

Ce guide explique comment utiliser les carrousels Owl Carousel intégrés au site IceCube Express.

## 📦 Fichiers ajoutés

### CSS
- **owl.css** - Styles de base + personnalisation IceCube
- **carousel-styles.css** - Styles additionnels pour les sections

### JavaScript
- **carousel-init.js** - Initialisation des carrousels

### HTML
- **index-with-carousel.html** - Page d'accueil avec carrousels intégrés

## 🚀 Installation

### Option 1 : Utiliser les CDN (Recommandé)

Les scripts sont déjà inclus dans `index-with-carousel.html` :

```html
<!-- Dans le <head> -->
<link rel="stylesheet" href="styles.css">
<link rel="stylesheet" href="owl.css">
<link rel="stylesheet" href="carousel-styles.css">

<!-- Avant </body> -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/OwlCarousel2/2.3.4/owl.carousel.min.js"></script>
<script src="script.js"></script>
<script src="carousel-init.js"></script>
```

### Option 2 : Fichiers locaux

1. Télécharger jQuery et Owl Carousel
2. Placer dans un dossier `/js` et `/css`
3. Mettre à jour les chemins dans le HTML

## 🎨 Carrousels disponibles

### 1. Carrousel de Produits

Affiche les 4 types de glaçons en rotation.

**Configuration :**
- Items affichés : 1-4 selon la largeur d'écran
- Autoplay : Oui (5 secondes)
- Navigation : Flèches + dots
- Responsive : Oui

**HTML :**
```html
<div class="owl-carousel products-carousel">
    <div class="product-card">
        <!-- Contenu produit -->
    </div>
</div>
```

### 2. Carrousel de Témoignages

Affiche les avis clients en rotation.

**Configuration :**
- Items affichés : 1-3 selon la largeur d'écran
- Autoplay : Oui (6 secondes)
- Navigation : Flèches + dots
- Background : Sombre (#162735)

**HTML :**
```html
<div class="owl-carousel testimonials-carousel">
    <div class="testimonial-card">
        <!-- Contenu témoignage -->
    </div>
</div>
```

### 3. Carrousel de Partenaires (optionnel)

Pour afficher des logos de partenaires.

**Configuration :**
- Items affichés : 2-6 selon la largeur d'écran
- Autoplay : Oui (3 secondes)
- Navigation : Aucune
- Effet : Grayscale au repos, couleur au hover

## 🎛️ Personnalisation

### Modifier la vitesse d'autoplay

Dans `carousel-init.js` :

```javascript
$('.products-carousel').owlCarousel({
    autoplayTimeout: 5000, // Modifier ici (en ms)
});
```

### Modifier le nombre d'items affichés

```javascript
responsive: {
    1200: {
        items: 4  // Changer le nombre ici
    }
}
```

### Désactiver l'autoplay

```javascript
$('.products-carousel').owlCarousel({
    autoplay: false,  // Mettre à false
});
```

### Changer les couleurs des flèches

Dans `owl.css`, section "CUSTOMISATION ICECUBE EXPRESS" :

```css
.owl-carousel .owl-nav button {
    background: rgba(148, 179, 202, 0.9) !important;
}

.owl-carousel .owl-nav button:hover {
    background: #406E86 !important;
}
```

## 🎨 Styles personnalisés

### Couleurs des dots

```css
.owl-carousel .owl-dot {
    background: #BDC1C8;  /* Couleur normale */
}

.owl-carousel .owl-dot.active {
    background: #406E86;  /* Couleur active */
}
```

### Effet de survol sur les cartes

Les cartes de produits ont un effet de brillance au survol, défini dans `carousel-styles.css`.

## 📱 Responsive

### Points de rupture

| Largeur d'écran | Produits | Témoignages | Partenaires |
|-----------------|----------|-------------|-------------|
| < 600px         | 1 item   | 1 item      | 2 items     |
| 600-999px       | 2 items  | 2 items     | 3 items     |
| 1000-1199px     | 3 items  | 3 items     | 4 items     |
| ≥ 1200px        | 4 items  | 3 items     | 6 items     |

### Navigation mobile

Sur mobile (< 480px), les flèches de navigation sont masquées.
Seuls les dots sont affichés + swipe tactile disponible.

## 🔧 Ajouter un nouveau carrousel

### Étape 1 : HTML

```html
<section class="my-carousel-section">
    <div class="container">
        <div class="owl-carousel my-custom-carousel">
            <div class="item">Contenu 1</div>
            <div class="item">Contenu 2</div>
            <div class="item">Contenu 3</div>
        </div>
    </div>
</section>
```

### Étape 2 : JavaScript

Dans `carousel-init.js`, ajouter :

```javascript
$('.my-custom-carousel').owlCarousel({
    loop: true,
    margin: 20,
    nav: true,
    navText: ['<span>‹</span>', '<span>›</span>'],
    dots: true,
    autoplay: true,
    autoplayTimeout: 5000,
    responsive: {
        0: { items: 1 },
        600: { items: 2 },
        1000: { items: 3 }
    }
});
```

### Étape 3 : CSS

Dans `carousel-styles.css`, ajouter :

```css
.my-carousel-section {
    padding: 80px 0;
    background: #FFFFFF;
}

.my-custom-carousel .item {
    /* Vos styles ici */
}
```

## 🎯 Options avancées

### Loop infini

```javascript
loop: true,  // Le carrousel tourne en boucle
```

### Lazy loading d'images

```javascript
lazyLoad: true,
```

```html
<img class="owl-lazy" data-src="image.jpg" alt="Description">
```

### Animation entre les slides

```javascript
animateOut: 'fadeOut',
animateIn: 'fadeIn',
```

### Centre le slide actif

```javascript
center: true,
```

### Autowidth (largeur automatique)

```javascript
autoWidth: true,
```

## 🐛 Dépannage

### Le carrousel ne s'affiche pas

1. Vérifier que jQuery est chargé AVANT Owl Carousel
2. Vérifier la console (F12) pour erreurs JavaScript
3. Vérifier que les classes CSS sont correctes

### Les flèches ne s'affichent pas

1. Vérifier `nav: true` dans la configuration
2. Vérifier que `owl.css` est bien chargé
3. Vérifier les z-index CSS

### L'autoplay ne fonctionne pas

1. Vérifier `autoplay: true`
2. Vérifier `autoplayTimeout` (en millisecondes)
3. Désactiver `autoplayHoverPause` si nécessaire

### Problèmes de hauteur

```javascript
autoHeight: true,  // Ajuster automatiquement la hauteur
```

## 📊 Événements Owl Carousel

### Écouter les événements

```javascript
$('.products-carousel').on('changed.owl.carousel', function(event) {
    console.log('Slide changé !');
});
```

### Événements disponibles

- `initialize.owl.carousel` - Après initialisation
- `initialized.owl.carousel` - Après initialisation complète
- `changed.owl.carousel` - Quand le slide change
- `dragged.owl.carousel` - Après un drag
- `translated.owl.carousel` - Après une transition

## 🎨 Exemples de personnalisation

### Carrousel avec pagination numérique

```javascript
$('.my-carousel').owlCarousel({
    dotsEach: true,
    dotsData: true,
});
```

```html
<div data-dot="<button>1</button>">Slide 1</div>
<div data-dot="<button>2</button>">Slide 2</div>
```

### Carrousel vertical

```css
.owl-carousel.vertical {
    transform: rotate(90deg);
}

.owl-carousel.vertical .owl-item {
    transform: rotate(-90deg);
}
```

## 📚 Ressources

- [Documentation Owl Carousel](https://owlcarousel2.github.io/OwlCarousel2/)
- [Démos et exemples](https://owlcarousel2.github.io/OwlCarousel2/demos/demos.html)
- [GitHub Owl Carousel](https://github.com/OwlCarousel2/OwlCarousel2)

## 💡 Bonnes pratiques

1. **Performance** : Limiter le nombre de slides (< 20)
2. **Images** : Optimiser la taille des images
3. **Lazy loading** : Utiliser pour les images lourdes
4. **Accessibilité** : Ajouter des attributs ARIA
5. **Mobile** : Tester sur différents appareils

## ⚠️ Notes importantes

- jQuery est **requis** pour Owl Carousel
- Version minimale : jQuery 1.7.0+
- Owl Carousel v2.3.4 utilisé
- Compatible IE9+ et tous navigateurs modernes

---

**Intégré par Claude** - Décembre 2025  
IceCube Express - Site Multi-pages
