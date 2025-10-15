// Portfolio B - Main JavaScript
// Restored working version

// Hero text animation
function initHeroAnimation() {
    const text = `Dazzle is a creative studio in New York City that makes everything DAZZLING. We make work across all mediums and platforms: branding, digital, motion, illustration, environmental, print, packaging & more.`;
    
    const heroEl = document.getElementById('hero');
    if (!heroEl) {
        console.warn('Hero element not found');
        return;
    }
    
    const words = text.split(' ');

    words.forEach((word, index) => {
        const wordSpan = document.createElement('span');
        wordSpan.className = 'word';
        wordSpan.style.animationDelay = `${index * 0.05}s`;
        
        if (word === 'DAZZLING.') {
            // Add sparkles before the word
            for (let i = 0; i < 3; i++) {
                const sparkle = document.createElement('span');
                sparkle.className = 'sparkle';
                sparkle.textContent = '✨';
                heroEl.appendChild(sparkle);
            }
        }
        
        wordSpan.textContent = word;
        heroEl.appendChild(wordSpan);
        heroEl.appendChild(document.createTextNode(' '));
    });
}

// Align hero animated gradient so it appears continuous across all word spans
function alignHeroGradient() {
    try {
        const heroEl = document.getElementById('hero');
        if (!heroEl) return;
        const rect = heroEl.getBoundingClientRect();
        // Match 200% 200% background-size in pixels
        const bgW = rect.width * 2;
        const bgH = rect.height * 2;
        heroEl.style.setProperty('--bgW', `${bgW}px ${bgH}px`);
        heroEl.style.setProperty('--bgY', '50%');

        const words = heroEl.querySelectorAll('.word');
        words.forEach(span => {
            const r = span.getBoundingClientRect();
            const offsetX = r.left - rect.left;
            const offsetY = r.top - rect.top;
            span.style.setProperty('--offsetX', `${offsetX}px`);
            span.style.setProperty('--offsetY', `${offsetY}px`);
        });
    } catch (e) {
        console.warn('alignHeroGradient failed', e);
    }
}

// Modal functionality
let currentVideo = null;

const videoFiles = {
    'trench': 'assets/media/videos/printedPoster.mov',
    'pool': 'assets/media/videos/runnersRotation.mov',
    'tree': 'assets/media/videos/tree-grates-ui.mov',
    'bathroom': 'assets/media/videos/bathroom-grates-ui.mov'
};

function openModal(title, type) {
    try {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modalTitle');
        const videoContainer = document.getElementById('videoContainer');
        
        if (!modal || !modalTitle || !videoContainer) {
            console.error('Modal elements not found');
            return;
        }
        
        modalTitle.textContent = title;
        
        const videoPath = videoFiles[type];
        if (!videoPath) {
            console.warn(`Video path not found for type: ${type}`);
            videoContainer.innerHTML = '<p style="padding: 20px;">Video not found</p>';
        } else {
            videoContainer.innerHTML = `
                <video controls autoplay>
                    <source src="${videoPath}" type="video/mp4">
                    <source src="${videoPath}" type="video/quicktime">
                    <p style="padding: 20px;">Video: ${videoPath}<br>Make sure to upload your .mov file and update the path in the videoFiles object.</p>
                </video>
            `;
        }
        
        currentVideo = videoContainer.querySelector('video');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    } catch (error) {
        console.error('Error opening modal:', error);
    }
}

function closeModal() {
    try {
        const modal = document.getElementById('modal');
        const videoContainer = document.getElementById('videoContainer');
        
        if (currentVideo) {
            currentVideo.pause();
            currentVideo = null;
        }
        
        if (modal) {
            modal.classList.remove('active');
        }
        
        document.body.style.overflow = 'auto';
        
        setTimeout(() => {
            if (videoContainer) {
                videoContainer.innerHTML = '<p>Place your .mov file here</p>';
            }
        }, 300);
    } catch (error) {
        console.error('Error closing modal:', error);
    }
}

// Event delegation for all interactive elements
function initEventDelegation() {
    document.addEventListener('click', function(e) {
        try {
            // Handle project card clicks
            const grateCard = e.target.closest('.grate-card');
            if (grateCard) {
                const modalType = grateCard.dataset.modalType;
                const modalTitle = grateCard.dataset.modalTitle;
                if (modalType && modalTitle) {
                    openModal(modalTitle, modalType);
                }
                return;
            }
            
            // Handle close page buttons
            const closeBtn = e.target.closest('.close-btn');
            if (closeBtn) {
                const pageName = closeBtn.dataset.closePage;
                if (pageName) {
                    closePage(pageName);
                }
                return;
            }
            
            // Handle modal close button
            if (e.target.matches('#closeModalBtn') || e.target.closest('.close-modal-btn')) {
                closeModal();
                return;
            }
            
            // Handle modal backdrop click
            if (e.target.matches('#modal')) {
                closeModal();
                return;
            }
        } catch (error) {
            console.error('Error handling click event:', error);
        }
    });
    
    // Handle escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            try {
                closeModal();
            } catch (error) {
                console.error('Error closing modal with escape key:', error);
            }
        }
    });
}


// Navigation functionality
function initNavigation() {
    try {
        const stickyNav = document.getElementById('stickyNav');
        const heroSection = document.getElementById('hero');
        
        if (!stickyNav || !heroSection) {
            console.warn('Navigation elements not found');
            return;
        }
        
        function handleScroll() {
            const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
            const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollPosition >= heroBottom - 100) {
                stickyNav.classList.add('visible');
            } else {
                stickyNav.classList.remove('visible');
            }
        }
        
        // Setup scroll listener with throttling
        handleScroll();
        let navTicking = false;
        
        function throttledNavScroll() {
            if (!navTicking) {
                requestAnimationFrame(() => {
                    handleScroll();
                    navTicking = false;
                });
                navTicking = true;
            }
        }
        
        window.addEventListener('scroll', throttledNavScroll);
        
        // Setup smooth scrolling
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetSection = document.querySelector(targetId);
                
                if (targetSection) {
                    const navHeight = stickyNav.offsetHeight;
                    const targetPosition = targetSection.offsetTop - navHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    } catch (error) {
        console.error('Error initializing navigation:', error);
    }
}

// Initialize accordion functionality - NO LETTER ANIMATION
function initAccordion() {
    try {
        // No text manipulation - keep accordion titles as static HTML
        
        // Accordion click functionality only
        const accordionHeaders = document.querySelectorAll('.accordion-header');
        
        accordionHeaders.forEach(header => {
            header.addEventListener('click', function() {
                const item = this.parentElement;
                const isActive = item.classList.contains('active');
                
                // Close all items
                document.querySelectorAll('.accordion-item').forEach(i => {
                    i.classList.remove('active');
                });
                
                // Open clicked item if it wasn't already open
                if (!isActive) {
                    item.classList.add('active');
                }
            });
        });
    } catch (error) {
        console.error('Error initializing accordion:', error);
    }
}




// Menu functionality
function initMenu() {
    try {
        // NO TEXT ANIMATION - KEEP MENU TEXT AS IS
        // Just add click handlers without modifying text
        
        // Menu item click handlers
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', function() {
                try {
                    const pageId = this.getAttribute('data-page');
                    const detailPage = document.getElementById(`page-${pageId}`);
                    
                    if (!detailPage) {
                        console.warn(`Detail page not found: ${pageId}`);
                        return;
                    }
                    
                    // Close all other detail pages
                    document.querySelectorAll('.detail-page').forEach(page => {
                        page.classList.remove('active');
                    });
                    document.querySelectorAll('.menu-item').forEach(menuItem => {
                        menuItem.classList.remove('active');
                    });
                    
                    // Open clicked detail page
                    this.classList.add('active');
                    detailPage.classList.add('active');
                } catch (error) {
                    console.error('Error handling menu click:', error);
                }
            });
        });
    } catch (error) {
        console.error('Error initializing menu:', error);
    }
}

// Close page functionality
function closePage(pageId) {
    try {
        const detailPage = document.getElementById(`page-${pageId}`);
        const menuItem = document.querySelector(`[data-page="${pageId}"]`);
        
        if (detailPage) {
            detailPage.classList.remove('active');
        }
        
        if (menuItem) {
            menuItem.classList.remove('active');
        }
    } catch (error) {
        console.error('Error closing page:', error);
    }
}

// Add immediate debugging
console.log('JavaScript file loaded');

// Application Initialization - Ensures all features work
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded fired');
    
    try {
        console.log('Starting app initialization...');
        
        // Initialize hero animation first (synchronous)
        console.log('Initializing hero...');
        initHeroAnimation();
        // Align gradient once words are in the DOM
        alignHeroGradient();
        // Re-align when fonts load and on resize
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => alignHeroGradient());
        }
        window.addEventListener('resize', () => requestAnimationFrame(alignHeroGradient));
        console.log('Hero initialized');
        
        // Initialize event delegation for interactions
        console.log('Initializing event delegation...');
        initEventDelegation();
        
        // Initialize navigation
        console.log('Initializing navigation...');
        initNavigation();
        
        // Initialize accordion functionality  
        console.log('Initializing accordion...');
        initAccordion();
        
        // Defer menu initialization to next frame to avoid blocking hero render
        console.log('Deferring menu initialization...');
        requestAnimationFrame(() => {
            initMenu();
            console.log('Menu initialized');
        });
        
        console.log('Portfolio app initialized successfully');
        
    } catch (error) {
        console.error('App initialization error:', error);
        console.error('Error stack:', error.stack);
    }
});

