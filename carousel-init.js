/**
 * IceCube Express - Carousel Initialization
 * Initialisation des carrousels Owl Carousel
 */

$(document).ready(function() {
    
    // ========================================
    // CARROUSEL DE PRODUITS
    // ========================================
    $('.products-carousel').owlCarousel({
        loop: true,
        margin: 20,
        nav: true,
        navText: ['<span>‹</span>', '<span>›</span>'],
        dots: true,
        autoplay: true,
        autoplayTimeout: 5000,
        autoplayHoverPause: true,
        responsive: {
            0: {
                items: 1
            },
            600: {
                items: 2
            },
            1000: {
                items: 3
            },
            1200: {
                items: 4
            }
        }
    });
    
    // ========================================
    // CARROUSEL DE TÉMOIGNAGES
    // ========================================
    $('.testimonials-carousel').owlCarousel({
        loop: true,
        margin: 30,
        nav: true,
        navText: ['<span>‹</span>', '<span>›</span>'],
        dots: true,
        autoplay: true,
        autoplayTimeout: 6000,
        autoplayHoverPause: true,
        responsive: {
            0: {
                items: 1
            },
            768: {
                items: 2
            },
            1024: {
                items: 3
            }
        }
    });
    
    // ========================================
    // CARROUSEL DE PARTENAIRES (si utilisé)
    // ========================================
    $('.partners-carousel').owlCarousel({
        loop: true,
        margin: 40,
        nav: false,
        dots: false,
        autoplay: true,
        autoplayTimeout: 3000,
        autoplayHoverPause: true,
        responsive: {
            0: {
                items: 2
            },
            600: {
                items: 3
            },
            1000: {
                items: 4
            },
            1200: {
                items: 6
            }
        }
    });
    
    // ========================================
    // ANIMATIONS PERSONNALISÉES
    // ========================================
    
    // Pause automatique au survol
    $('.owl-carousel').on('mouseenter', function() {
        $(this).trigger('stop.owl.autoplay');
    });
    
    $('.owl-carousel').on('mouseleave', function() {
        $(this).trigger('play.owl.autoplay', [5000]);
    });
    
    // Log de confirmation
    console.log('🎠 Owl Carousel initialisé avec succès');
});
