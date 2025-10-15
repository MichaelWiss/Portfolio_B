// Portfolio B - Main JavaScript
// Extracted from demo1.html for better organization

// Hero text animation
const text = `Dazzle is a creative studio in New York City that makes everything DAZZLING. We make work across all mediums and platforms: branding, digital, motion, illustration, environmental, print, packaging & more.`;

const heroEl = document.getElementById('hero');
const words = text.split(' ');

words.forEach((word, index) => {
    const wordSpan = document.createElement('span');
    wordSpan.className = 'word';
    wordSpan.style.animationDelay = `${index * 0.05}s`;
    
    if (word === 'DAZZLING.') {
        const sparkle1 = document.createElement('span');
        sparkle1.className = 'sparkle';
        sparkle1.textContent = '✨';
        heroEl.appendChild(sparkle1);
        
        const sparkle2 = document.createElement('span');
        sparkle2.className = 'sparkle';
        sparkle2.textContent = '✨';
        heroEl.appendChild(sparkle2);
        
        const sparkle3 = document.createElement('span');
        sparkle3.className = 'sparkle';
        sparkle3.textContent = '✨';
        heroEl.appendChild(sparkle3);
    }
    
    wordSpan.textContent = word;
    heroEl.appendChild(wordSpan);
    heroEl.appendChild(document.createTextNode(' '));
});

// Modal functionality
let currentVideo = null;

const videoFiles = {
    'trench': 'assets/media/videos/printedPoster.mov',
    'pool': 'assets/media/videos/runnersRotation.mov',
    'tree': 'assets/media/videos/tree-grates-ui.mov',
    'bathroom': 'assets/media/videos/bathroom-grates-ui.mov'
};

function openModal(title, type) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const videoContainer = document.getElementById('videoContainer');
    
    modalTitle.textContent = title;
    
    const videoPath = videoFiles[type];
    
    videoContainer.innerHTML = `
        <video controls autoplay>
            <source src="${videoPath}" type="video/mp4">
            <source src="${videoPath}" type="video/quicktime">
            <p style="padding: 20px;">Video: ${videoPath}<br>Make sure to upload your .mov file and update the path in the videoFiles object.</p>
        </video>
    `;
    
    currentVideo = videoContainer.querySelector('video');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('modal');
    if (currentVideo) {
        currentVideo.pause();
    }
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    
    setTimeout(() => {
        document.getElementById('videoContainer').innerHTML = '<p>Place your .mov file here</p>';
    }, 300);
}

// Modal event listeners
document.getElementById('modal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Sticky Navigation functionality
const stickyNav = document.getElementById('stickyNav');
const heroSection = document.getElementById('hero');

function handleScroll() {
    const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollPosition >= heroBottom - 100) {
        stickyNav.classList.add('visible');
    } else {
        stickyNav.classList.remove('visible');
    }
}

// Initial check and scroll event listener
handleScroll();
window.addEventListener('scroll', handleScroll);

// Smooth scrolling for navigation links
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
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

// Initialize accordion functionality
function initAccordion() {
    // Animate letters on page load
    const accordionTitles = document.querySelectorAll('.accordion-title');
    
    accordionTitles.forEach((title, titleIndex) => {
        const text = title.textContent;
        title.innerHTML = '';
        
        text.split('').forEach((char, index) => {
            const span = document.createElement('span');
            span.className = 'letter';
            span.textContent = char === ' ' ? '\u00A0' : char;
            span.style.animationDelay = `${(titleIndex * 0.15) + (index * 0.02)}s`;
            title.appendChild(span);
        });
    });

    // Set up accordion functionality using event delegation
    const accordionContainer = document.getElementById('accordionContainer');
    
    accordionContainer.addEventListener('click', function(e) {
        // Find the closest accordion header
        const header = e.target.closest('.accordion-header');
        if (!header) return;
        
        const item = header.parentElement;
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
}

// Menu functionality for sliding menu section
function initMenu() {
    // Animate menu titles on page load
    const menuItems = document.querySelectorAll('.menu-item span[id^="title-"]');
    
    menuItems.forEach((titleEl, titleIndex) => {
        const text = titleEl.textContent;
        titleEl.innerHTML = '';
        
        text.split('').forEach((char, index) => {
            const span = document.createElement('span');
            span.className = 'letter';
            span.textContent = char === ' ' ? '\u00A0' : char;
            span.style.animationDelay = `${(titleIndex * 0.2) + (index * 0.03)}s`;
            titleEl.appendChild(span);
        });
    });

    // Menu item click handlers
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function() {
            const pageId = this.getAttribute('data-page');
            const detailPage = document.getElementById(`page-${pageId}`);
            
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
        });
    });
}

// Close page function for detail pages
function closePage(pageId) {
    const detailPage = document.getElementById(`page-${pageId}`);
    const menuItem = document.querySelector(`[data-page="${pageId}"]`);
    
    detailPage.classList.remove('active');
    menuItem.classList.remove('active');
}

// Initialize all functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initAccordion();
    initMenu();
});