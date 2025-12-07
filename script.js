/* ============================================
   IceCube Express - JavaScript
   Site Multi-pages
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    
    // ========================================
    // 1. HEADER STICKY & SCROLL EFFECT
    // ========================================
    const header = document.getElementById('header');
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
    
    // ========================================
    // 2. MOBILE MENU TOGGLE
    // ========================================
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const nav = document.getElementById('nav');
    
    if (mobileMenuToggle && nav) {
        mobileMenuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            this.classList.toggle('active');
            nav.classList.toggle('active');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.header-content')) {
                nav.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
            }
        });
        
        // Close menu when clicking on a link
        const navLinks = nav.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                nav.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
            });
        });
    }
    
    // ========================================
    // 3. SCROLL REVEAL ANIMATIONS
    // ========================================
    const revealElements = document.querySelectorAll('.reveal');
    
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const revealObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, observerOptions);
    
    revealElements.forEach(el => {
        revealObserver.observe(el);
    });
    
    // ========================================
    // 4. FAQ ACCORDION
    // ========================================
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        if (question) {
            question.addEventListener('click', function() {
                // Close other items (optional)
                faqItems.forEach(otherItem => {
                    if (otherItem !== item && otherItem.classList.contains('active')) {
                        otherItem.classList.remove('active');
                    }
                });
                
                // Toggle current item
                item.classList.toggle('active');
            });
        }
    });
    
    // ========================================
    // 5. QUOTE FORM VALIDATION & SUBMISSION
    // ========================================
    const quoteForm = document.getElementById('quoteForm');
    const quoteSuccess = document.getElementById('quoteSuccess');
    const quoteFormWrapper = document.getElementById('quoteFormWrapper');
    
    if (quoteForm) {
        quoteForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                eventType: document.getElementById('eventType').value,
                guestCount: document.getElementById('guestCount').value,
                eventDate: document.getElementById('eventDate').value,
                eventTime: document.getElementById('eventTime').value,
                address: document.getElementById('address').value,
                products: Array.from(document.querySelectorAll('input[name="products"]:checked')).map(cb => cb.value),
                quantity: document.getElementById('quantity').value,
                message: document.getElementById('message').value
            };
            
            // Basic validation
            if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
                alert('Veuillez remplir tous les champs obligatoires');
                return;
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                alert('Veuillez entrer une adresse email valide');
                return;
            }
            
            // Simulate sending
            console.log('Quote form submitted:', formData);
            
            // Show success message
            quoteForm.style.display = 'none';
            quoteSuccess.style.display = 'block';
            
            // Scroll to success message
            quoteSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    }
    
    // ========================================
    // 6. CONTACT FORM VALIDATION & SUBMISSION
    // ========================================
    const contactForm = document.getElementById('contactForm');
    const contactSuccess = document.getElementById('contactSuccess');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                name: document.getElementById('contactName').value,
                email: document.getElementById('contactEmail').value,
                phone: document.getElementById('contactPhone').value,
                subject: document.getElementById('contactSubject').value,
                message: document.getElementById('contactMessage').value
            };
            
            // Validation
            if (!formData.name || !formData.email || !formData.subject || !formData.message) {
                alert('Veuillez remplir tous les champs obligatoires');
                return;
            }
            
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                alert('Veuillez entrer une adresse email valide');
                return;
            }
            
            console.log('Contact form submitted:', formData);
            
            // Show success
            contactForm.style.display = 'none';
            contactSuccess.style.display = 'block';
            
            contactSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    }
    
    // ========================================
    // 7. NEWSLETTER FORM
    // ========================================
    const newsletterForm = document.getElementById('newsletterForm');
    
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const emailInput = this.querySelector('input[type="email"]');
            const email = emailInput.value;
            
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Veuillez entrer une adresse email valide');
                return;
            }
            
            console.log('Newsletter subscription:', email);
            alert('Merci pour votre inscription ! Vous recevrez nos prochaines offres.');
            this.reset();
        });
    }
    
    // ========================================
    // 8. FORM INPUT VALIDATION (REAL-TIME)
    // ========================================
    const formInputs = document.querySelectorAll('.form-group input, .form-group select, .form-group textarea');
    
    formInputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateInput(this);
        });
        
        input.addEventListener('input', function() {
            if (this.classList.contains('error')) {
                this.classList.remove('error');
            }
        });
    });
    
    function validateInput(input) {
        if (input.hasAttribute('required') && !input.value.trim()) {
            input.classList.add('error');
            return false;
        }
        
        if (input.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(input.value)) {
                input.classList.add('error');
                return false;
            }
        }
        
        input.classList.remove('error');
        return true;
    }
    
    // Add error style dynamically
    const style = document.createElement('style');
    style.textContent = `
        .form-group input.error,
        .form-group select.error,
        .form-group textarea.error {
            border-color: #EF4444;
            animation: shake 0.3s ease;
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
    `;
    document.head.appendChild(style);
    
    // ========================================
    // 9. SET MINIMUM DATE FOR EVENT DATE
    // ========================================
    const eventDateInput = document.getElementById('eventDate');
    
    if (eventDateInput) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const minDate = tomorrow.toISOString().split('T')[0];
        eventDateInput.setAttribute('min', minDate);
    }
    
    // ========================================
    // 10. HIGHLIGHT ACTIVE PAGE IN NAVIGATION
    // ========================================
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active');
        }
    });
    
    // ========================================
    // 11. SMOOTH SCROLL FOR ANCHOR LINKS
    // ========================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href.length > 1) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const headerHeight = header.offsetHeight;
                    const targetPosition = target.offsetTop - headerHeight;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
    
    // ========================================
    // 12. PARALLAX EFFECT ON HERO (IF EXISTS)
    // ========================================
    const heroBackground = document.querySelector('.hero-background');
    
    if (heroBackground) {
        window.addEventListener('scroll', function() {
            const scrolled = window.pageYOffset;
            const parallaxSpeed = 0.5;
            
            if (scrolled < window.innerHeight) {
                heroBackground.style.transform = `translateY(${scrolled * parallaxSpeed}px)`;
            }
        });
    }
    
    // ========================================
    // 13. HOVER EFFECT ON TILES
    // ========================================
    const tiles = document.querySelectorAll('.tile');
    
    tiles.forEach(tile => {
        tile.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        });
    });
    
    // ========================================
    // 14. LOADING INDICATOR
    // ========================================
    window.addEventListener('load', function() {
        document.body.classList.add('loaded');
        console.log('🧊 IceCube Express - Site chargé avec succès!');
    });
    
    // ========================================
    // UTILITY FUNCTIONS
    // ========================================
    
    // Debounce function for scroll events
    function debounce(func, wait = 10) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
    
    // Check if element is in viewport
    function isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
    
    // ========================================
    // CONSOLE MESSAGE
    // ========================================
    console.log('%c🧊 IceCube Express', 'font-size: 24px; font-weight: bold; color: #94B3CA;');
    console.log('%cLivraison de glaçons premium', 'font-size: 14px; color: #406E86;');
    console.log('%c---', 'color: #BDC1C8;');
    console.log('%cSite développé avec HTML, CSS et JavaScript Vanilla', 'font-size: 12px; color: #162735;');
    console.log('%cToutes les animations sont initialisées ✅', 'color: #10B981; font-weight: bold;');
});
